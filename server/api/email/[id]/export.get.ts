import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

import type { EmailWithRelations } from "~/types/Email";

import db from "@/lib/db/index";
import { emails } from "@/lib/db/schema/index";
import { routeParamsSchema } from "~/lib/validations";

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);

  // Get email data with related links and images
  const emailData = await db.query.emails.findFirst({
    where: eq(emails.id, id),
    with: {
      links: true,
      images: true,
      spellErrors: true,
      qaChecklist: true,
      qaNotes: true,
    },
  }) as EmailWithRelations | null;

  if (!emailData) {
    throw createError({
      statusCode: 404,
      statusMessage: "Email not found",
    });
  }

  if (!emailData.analyzed) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email must be analyzed before exporting. Please analyze the email first.",
    });
  }

  // Generate link status summary
  const linkStatusSummary = emailData.links.reduce((acc, link) => {
    const status = link.status || 0;
    if (status >= 200 && status < 300)
      acc.successful++;
    else if (status >= 300 && status < 400)
      acc.redirects++;
    else if (status >= 400)
      acc.failed++;
    else acc.unknown++;
    return acc;
  }, { successful: 0, redirects: 0, failed: 0, unknown: 0 });

  // Generate image status summary
  const imageStatusSummary = emailData.images.reduce((acc, image) => {
    const status = image.status || 0;
    if (status >= 200 && status < 300)
      acc.successful++;
    else if (status >= 400)
      acc.failed++;
    else acc.unknown++;
    return acc;
  }, { successful: 0, failed: 0, unknown: 0 });

  // Generate spell check summary
  const spellCheckSummary = {
    totalErrors: emailData.spellErrors?.length || 0,
    status: emailData.spellErrors?.length === 0
      ? "Perfect"
      : emailData.spellErrors?.length <= 5
        ? "Good"
        : "Needs Review",
  };

  // Generate QA checklist summary
  const qaChecklistSummary = {
    totalItems: emailData.qaChecklist?.length || 0,
    completedItems: emailData.qaChecklist?.filter(item => item.completed).length || 0,
    completionPercentage: emailData.qaChecklist?.length > 0
      ? Math.round((emailData.qaChecklist.filter(item => item.completed).length / emailData.qaChecklist.length) * 100)
      : 0,
    status: emailData.qaChecklist?.length === 0
      ? "Not Started"
      : (emailData.qaChecklist.filter(item => item.completed).length / emailData.qaChecklist.length) === 1
          ? "Complete"
          : (emailData.qaChecklist.filter(item => item.completed).length / emailData.qaChecklist.length) >= 0.75
              ? "Nearly Complete"
              : "In Progress",
  };

  // Generate QA notes summary
  const qaNotesCount = emailData.qaNotes?.length || 0;

  // Function to convert image to base64 data URL
  async function imageToDataUrl(imagePath: string): Promise<string> {
    try {
      const fullPath = join(process.cwd(), "public", imagePath);
      const imageBuffer = await readFile(fullPath);
      const base64 = imageBuffer.toString("base64");
      const extension = imagePath.split(".").pop()?.toLowerCase();
      const mimeType = extension === "png" ? "image/png" : "image/jpeg";
      return `data:${mimeType};base64,${base64}`;
    }
    catch (error) {
      console.error(`Failed to load image: ${imagePath}`, error);
      return "";
    }
  }

  // Convert screenshots to data URLs
  const emailPreviewDataUrl = emailData.screenshotUrl ? await imageToDataUrl(emailData.screenshotUrl) : "";

  // Convert link screenshots to data URLs
  const linkScreenshots: Record<string, string> = {};
  for (const link of emailData.links) {
    if (link.screenshotPath) {
      const screenshotPath = `/uploads/analysis/email-${emailData.id}/${link.screenshotPath}`;
      linkScreenshots[link.id] = await imageToDataUrl(screenshotPath);
    }
  }

  // Create HTML template for PDF
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>QA Report - ${emailData.subject || "Email"}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @media print {
                .page-break { page-break-before: always; }
            }
            .utm-table td, .utm-table th {
                border: 1px solid #e5e7eb;
                padding: 8px;
                text-align: left;
            }
            .utm-table {
                border-collapse: collapse;
                width: 100%;
                margin: 10px 0;
            }
        </style>
    </head>
    <body class="bg-white p-8 text-sm">
        <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="mb-8 border-b pb-4">
                <h1 class="text-2xl font-bold text-gray-900 mb-2">Email QA Report</h1>
                <div class="grid grid-cols-2 gap-4 text-gray-600">
                    <div>
                        <strong>Subject:</strong> ${emailData.subject || "No subject"}
                    </div>
                    <div>
                        <strong>Analysis Date:</strong> ${new Date(emailData.updatedAt).toLocaleDateString()}
                    </div>
                    <div>
                        <strong>Email ID:</strong> ${emailData.id}
                    </div>
                    <div>
                        <strong>File:</strong> ${emailData.filename}
                    </div>
                </div>
            </div>

            <!-- Summary Section -->
            <div class="mb-8">
                <h2 class="text-xl font-semibold mb-4 text-gray-900">Summary</h2>
                
                <!-- Links Summary Table -->
                <div class="mb-6">
                    <h3 class="text-lg font-medium mb-2 text-gray-800">Links Overview</h3>
                    ${emailData.links.length > 0
                      ? `
                        <table class="utm-table text-xs w-full">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="text-left">Text</th>
                                    <th class="text-left">Status</th>
                                    <th class="text-left">utm_medium</th>
                                    <th class="text-left">utm_campaign</th>
                                    <th class="text-left">utm_source</th>
                                    <th class="text-left">utm_content</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${emailData.links.map(link => `
                                    <tr>
                                        <td class="font-medium" style="max-width: 200px; word-break: break-all;">
                                            ${link.text || link.finalUrl || link.url || "N/A"}
                                        </td>
                                        <td>
                                            <span class="${(link.status || 0) >= 200 && (link.status || 0) < 300 ? "text-green-600" : "text-red-600"}">
                                                ${link.status || "N/A"}
                                            </span>
                                        </td>
                                        <td>${link.utmParams?.utm_medium || "-"}</td>
                                        <td>${link.utmParams?.utm_campaign || "-"}</td>
                                        <td>${link.utmParams?.utm_source || "-"}</td>
                                        <td>${link.utmParams?.utm_content || "-"}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    `
                      : "<p class=\"text-gray-500\">No links found</p>"}
                </div>

                <!-- Email Preview -->
                <div class="mb-6">
                    <h3 class="text-lg font-medium mb-2 text-gray-800">Email Preview</h3>
                    ${emailPreviewDataUrl
                      ? `
                        <img src="${emailPreviewDataUrl}" 
                             alt="Email Preview" 
                             class="border border-gray-300 max-w-full h-auto mb-4"
                             style="max-height: 400px; object-fit: contain;">
                    `
                      : "<p class=\"text-gray-500\">No preview available</p>"}
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <!-- Links Summary -->
                    <div class="bg-gray-50 p-4 rounded">
                        <h3 class="text-lg font-medium mb-2 text-gray-800">Links Analysis</h3>
                        <div class="space-y-1">
                            <div><strong>Total Links:</strong> ${emailData.links.length}</div>
                            ${linkStatusSummary.successful > 0 ? `<div class="text-green-600">✓ ${linkStatusSummary.successful} successful (200-299)</div>` : ""}
                            ${linkStatusSummary.redirects > 0 ? `<div class="text-yellow-600">↻ ${linkStatusSummary.redirects} redirects (300-399)</div>` : ""}
                            ${linkStatusSummary.failed > 0 ? `<div class="text-red-600">✗ ${linkStatusSummary.failed} failed (400+)</div>` : ""}
                            ${linkStatusSummary.unknown > 0 ? `<div class="text-gray-600">? ${linkStatusSummary.unknown} unknown</div>` : ""}
                        </div>
                    </div>

                    <!-- Images Summary -->
                    <div class="bg-gray-50 p-4 rounded">
                        <h3 class="text-lg font-medium mb-2 text-gray-800">Images Analysis</h3>
                        <div class="space-y-1">
                            <div><strong>Total Images:</strong> ${emailData.images.length}</div>
                            ${imageStatusSummary.successful > 0 ? `<div class="text-green-600">✓ ${imageStatusSummary.successful} accessible</div>` : ""}
                            ${imageStatusSummary.failed > 0 ? `<div class="text-red-600">✗ ${imageStatusSummary.failed} failed</div>` : ""}
                            ${imageStatusSummary.unknown > 0 ? `<div class="text-gray-600">? ${imageStatusSummary.unknown} unknown</div>` : ""}
                        </div>
                    </div>
                </div>

                <!-- Spell Check Summary -->
                <div class="bg-gray-50 p-4 rounded mb-6">
                    <h3 class="text-lg font-medium mb-2 text-gray-800">Spelling & Grammar</h3>
                    <div class="space-y-1">
                        <div><strong>Status:</strong> 
                            <span class="${spellCheckSummary.status === "Perfect" ? "text-green-600" : spellCheckSummary.status === "Good" ? "text-yellow-600" : "text-red-600"}">
                                ${spellCheckSummary.status}
                            </span>
                        </div>
                        <div><strong>Errors Found:</strong> ${spellCheckSummary.totalErrors}</div>
                    </div>
                </div>

                <!-- QA Status Grid -->
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <!-- QA Checklist Summary -->
                    <div class="bg-blue-50 p-4 rounded">
                        <h3 class="text-lg font-medium mb-2 text-gray-800">QA Checklist</h3>
                        <div class="space-y-1">
                            <div><strong>Status:</strong> 
                                <span class="${qaChecklistSummary.status === "Complete" ? "text-green-600" : qaChecklistSummary.status === "Nearly Complete" ? "text-yellow-600" : qaChecklistSummary.status === "In Progress" ? "text-blue-600" : "text-gray-600"}">
                                    ${qaChecklistSummary.status}
                                </span>
                            </div>
                            <div><strong>Progress:</strong> ${qaChecklistSummary.completedItems}/${qaChecklistSummary.totalItems} items (${qaChecklistSummary.completionPercentage}%)</div>
                        </div>
                    </div>

                    <!-- QA Notes Summary -->
                    <div class="bg-yellow-50 p-4 rounded">
                        <h3 class="text-lg font-medium mb-2 text-gray-800">QA Notes</h3>
                        <div class="space-y-1">
                            <div><strong>Total Notes:</strong> ${qaNotesCount}</div>
                            <div><strong>Status:</strong> 
                                <span class="${qaNotesCount === 0 ? "text-gray-600" : "text-blue-600"}">
                                    ${qaNotesCount === 0 ? "No notes added" : `${qaNotesCount} note${qaNotesCount > 1 ? "s" : ""} documented`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detailed Links Analysis -->
            ${emailData.links.length > 0
              ? `
            <div class="page-break mb-8">
                <h2 class="text-xl font-semibold mb-4 text-gray-900">Detailed Links Analysis</h2>
                ${emailData.links.map((link, index) => `
                    <div class="mb-6 border border-gray-200 rounded p-4">
                        <div class="mb-3">
                            <h3 class="text-lg font-medium text-gray-800">Link ${index + 1}</h3>
                            <div class="grid grid-cols-2 gap-4 mt-2 text-sm">
                                <div><strong>Text:</strong> ${link.text || "No text"}</div>
                                <div><strong>Status:</strong> 
                                    <span class="${(link.status || 0) >= 200 && (link.status || 0) < 300 ? "text-green-600" : "text-red-600"}">
                                        ${link.status || "N/A"}
                                    </span>
                                </div>
                                <div class="col-span-2" style="word-break: break-all; max-width: 100%; overflow-wrap: break-word;">
                                    <strong>URL:</strong> ${link.url || "N/A"}
                                </div>
                                ${link.finalUrl && link.finalUrl !== link.url
                                  ? `
                                <div class="col-span-2" style="word-break: break-all; max-width: 100%; overflow-wrap: break-word;">
                                    <strong>Final URL:</strong> ${link.finalUrl}
                                </div>`
                                  : ""}
                            </div>
                        </div>

                        ${Object.keys(link.utmParams || {}).length > 0
                          ? `
                        <div class="mb-3">
                            <h4 class="font-medium text-gray-700 mb-2">UTM Parameters</h4>
                            <table class="utm-table text-xs">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th>Parameter</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Object.entries(link.utmParams || {}).map(([key, value]) => `
                                        <tr>
                                            <td class="font-medium">${key}</td>
                                            <td>${value}</td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        </div>
                        `
                          : ""}

                        ${linkScreenshots[link.id]
                          ? `
                        <div>
                            <h4 class="font-medium text-gray-700 mb-2">Screenshot</h4>
                            <img src="${linkScreenshots[link.id]}" 
                                 alt="Link screenshot" 
                                 class="border border-gray-300 max-w-full h-auto"
                                 style="max-width: 300px; max-height: 200px; object-fit: contain;">
                        </div>
                        `
                          : ""}
                    </div>
                `).join("")}
            </div>
            `
              : ""}

            <!-- Detailed Images Analysis -->
            ${emailData.images.length > 0
              ? `
            <div class="page-break mb-8">
                <h2 class="text-xl font-semibold mb-4 text-gray-900">Detailed Images Analysis</h2>
                ${emailData.images.map((image, index) => `
                    <div class="mb-4 border border-gray-200 rounded p-4">
                        <h3 class="text-lg font-medium text-gray-800 mb-2">Image ${index + 1}</h3>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Alt Text:</strong> ${image.alt || "No alt text"}</div>
                            <div><strong>Status:</strong> 
                                <span class="${(image.status || 0) >= 200 && (image.status || 0) < 300 ? "text-green-600" : "text-red-600"}">
                                    ${image.status || "N/A"}
                                </span>
                            </div>
                            <div><strong>Dimensions:</strong> ${image.width && image.height ? `${image.width} × ${image.height}` : "Unknown"}</div>
                            <div class="col-span-2"><strong>Source:</strong> ${image.src || "N/A"}</div>
                        </div>
                    </div>
                `).join("")}
            </div>
            `
              : ""}

            <!-- Detailed Spell Check Analysis -->
            ${emailData.spellErrors && emailData.spellErrors.length > 0
              ? `
            <div class="page-break mb-8">
                <h2 class="text-xl font-semibold mb-4 text-gray-900">Detailed Spelling & Grammar Analysis</h2>
                ${emailData.spellErrors.map((error, index) => {
                  const suggestions = JSON.parse(error.suggestions || "[]");
                  return `
                    <div class="mb-4 border border-gray-200 rounded p-4">
                        <h3 class="text-lg font-medium text-gray-800 mb-2">Error ${index + 1}</h3>
                        <div class="grid grid-cols-1 gap-4 text-sm">
                            <div><strong>Misspelled Word:</strong> 
                                <code class="bg-red-100 text-red-800 px-2 py-1 rounded">${error.word}</code>
                            </div>
                            <div><strong>Context:</strong> ${error.context}</div>
                            ${suggestions.length > 0 ? `<div><strong>Suggestions:</strong> ${suggestions.join(", ")}</div>` : ""}
                        </div>
                    </div>
                `;
                }).join("")}
            </div>
            `
              : ""}

            <!-- QA Checklist Section -->
            ${emailData.qaChecklist && emailData.qaChecklist.length > 0
              ? `
            <div class="page-break mb-8">
                <h2 class="text-xl font-semibold mb-4 text-gray-900">QA Checklist Results</h2>
                <div class="space-y-4">
                    ${emailData.qaChecklist.map((item, index) => `
                        <div class="border border-gray-200 rounded p-4 ${item.completed ? "bg-green-50" : "bg-gray-50"}">
                            <div class="flex items-start space-x-3">
                                <div class="flex-shrink-0 mt-1">
                                    <span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-medium ${item.completed ? "bg-green-500" : "bg-gray-400"}">
                                        ${item.completed ? "✓" : index + 1}
                                    </span>
                                </div>
                                <div class="flex-1">
                                    <div class="text-sm font-medium text-gray-900 ${item.completed ? "line-through" : ""}">
                                        ${item.itemText}
                                    </div>
                                    <div class="text-xs text-gray-500 mt-1">
                                        Status: <span class="${item.completed ? "text-green-600" : "text-gray-600"}">${item.completed ? "Completed" : "Pending"}</span>
                                    </div>
                                    ${item.note
                                      ? `
                                    <div class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                        <strong>Note:</strong> ${item.note}
                                    </div>
                                    `
                                      : ""}
                                </div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
            `
              : ""}

            <!-- QA Notes Section -->
            ${emailData.qaNotes && emailData.qaNotes.length > 0
              ? `
            <div class="page-break mb-8">
                <h2 class="text-xl font-semibold mb-4 text-gray-900">QA Notes</h2>
                <div class="space-y-4">
                    ${emailData.qaNotes.map((note, index) => `
                        <div class="border border-gray-200 rounded p-4 bg-blue-50">
                            <div class="flex items-start justify-between mb-2">
                                <span class="text-sm font-medium text-gray-900">Note ${index + 1}</span>
                                <span class="text-xs text-gray-500">${new Date(note.createdAt).toLocaleString()}</span>
                            </div>
                            <div class="text-sm text-gray-700 whitespace-pre-wrap">
                                ${note.text}
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
            `
              : ""}

            <!-- Footer -->
            <div class="mt-8 pt-4 border-t border-gray-300 text-center text-gray-500 text-xs">
                <p>Generated by QA Buddy on ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>
    `;

  // Generate PDF using Playwright
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.setContent(htmlTemplate, { waitUntil: "networkidle" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "1cm",
        right: "1cm",
        bottom: "1cm",
        left: "1cm",
      },
    });

    await browser.close();

    // Set response headers for PDF download
    setHeader(event, "Content-Type", "application/pdf");
    setHeader(event, "Content-Disposition", `attachment; filename="email-${id}-qa-report.pdf"`);

    return pdf;
  }
  catch (error) {
    console.error(error);
    await browser.close();
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to generate PDF report",
    });
  }
});
