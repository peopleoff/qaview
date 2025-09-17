import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

import db from "@/lib/db/index";
import { emails } from "@/lib/db/schema/index";
import { routeParamsSchema } from "~/lib/validations";
import { renderTemplate } from "~/server/utils/template-renderer";

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
      attachments: true,
    },
  });

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
  const emailDesktopDataUrl = emailData.screenshotDesktopUrl ? await imageToDataUrl(emailData.screenshotDesktopUrl) : "";
  const emailMobileDataUrl = emailData.screenshotMobileUrl ? await imageToDataUrl(emailData.screenshotMobileUrl) : "";

  // Convert link screenshots to data URLs
  const linkScreenshots: Record<string, string> = {};
  for (const link of emailData.links) {
    if (link.screenshotPath) {
      const fullScreenshotPath = `/uploads/analysis/email-${emailData.id}/${link.screenshotPath}`;
      linkScreenshots[link.id] = await imageToDataUrl(fullScreenshotPath);
    }
  }

  // Convert Attachment attachments to data URLs
  const attachmentUrls: Record<string, string> = {};
  for (const attachment of emailData.attachments || []) {
    if (attachment.mimeType.startsWith("image/")) {
      attachmentUrls[attachment.id] = await imageToDataUrl(attachment.path);
    }
  }

  // Prepare template data
  const templateData = {
    emailData,
    emailPreviewDataUrl,
    emailDesktopDataUrl,
    emailMobileDataUrl,
    linkScreenshots,
    attachmentUrls,
    linkStatusSummary,
    imageStatusSummary,
    spellCheckSummary,
    qaChecklistSummary,
    qaNotesCount,
    generatedAt: new Date().toLocaleString(),
  };

  // Render HTML template using Handlebars
  const htmlTemplate = await renderTemplate("email-report", templateData, "pdf-report");

  // Generate PDF using Playwright
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.setContent(htmlTemplate, { waitUntil: "networkidle" });

    const pdf = await page.pdf({
      format: "A3",
      printBackground: true,
      scale: 0.8,
      margin: {
        top: "2cm",
        right: "2cm",
        bottom: "2cm",
        left: "2cm",
      },
    });

    await browser.close();

    // Generate filename using emailId if available, fallback to database ID
    const filename = emailData.emailId ? `${emailData.emailId}-qa.pdf` : `${id}-qa.pdf`;

    // Set response headers for PDF download
    setHeader(event, "Content-Type", "application/pdf");
    setHeader(event, "Content-Disposition", `attachment; filename="${filename}"`);

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
