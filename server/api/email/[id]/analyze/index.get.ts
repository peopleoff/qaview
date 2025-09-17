import { eq } from "drizzle-orm";
import { simpleParser } from "mailparser";
import { readFile } from "node:fs/promises";

import db from "@/lib/db/index";
import { emails, images, links, spellErrors } from "@/lib/db/schema/index";
import { analyzeEmailContent } from "@/server/utils/email-analyzer";
import { routeParamsSchema } from "~/lib/validations";

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);
  const email = await db.select().from(emails).where(eq(emails.id, id)).limit(1);
  if (!email[0]) {
    throw createError({
      statusCode: 404,
      statusMessage: "Email not found",
    });
  };
  // Read the file from the path
  const file = await readFile(email[0].filePath, "utf-8");
  const parsed = await simpleParser(file);
  const result = await analyzeEmailContent(email[0].id, parsed.html || "");
  
  // Extract utm_campaign values from all links to determine emailId
  const utmCampaigns = result.links
    .map(link => link.utmParams?.utm_campaign)
    .filter(campaign => campaign && campaign.trim() !== ""); // Remove null/empty values
  
  const uniqueCampaigns = [...new Set(utmCampaigns)];
  
  let extractedEmailId: string | null = null;
  
  if (uniqueCampaigns.length === 1) {
    // Single unique utm_campaign found - set as emailId
    extractedEmailId = uniqueCampaigns[0];
  } else if (uniqueCampaigns.length > 1) {
    // Multiple utm_campaign values found - this indicates an issue with the email
    // For now, we'll leave emailId as null and handle this case in the UI later
    console.warn(`Multiple utm_campaign values found for email ${email[0].id}:`, uniqueCampaigns);
    extractedEmailId = null;
  }
  // If uniqueCampaigns.length === 0, no utm_campaign found, leave as null
  
  await db.update(emails).set({
    analyzed: true,
    subject: parsed.subject || null,
    emailId: extractedEmailId,
    screenshotUrl: result.screenshots.fullPage, // Legacy compatibility
    screenshotDesktopUrl: result.screenshots.desktop,
    screenshotMobileUrl: result.screenshots.mobile,
  }).where(eq(emails.id, email[0].id));
  await db.insert(links).values(result.links.map(link => ({
    ...link,
    emailId: email[0].id,
  })));
  await db.insert(images).values(result.images.map(image => ({
    ...image,
    emailId: email[0].id,
    width: (image.width && !Number.isNaN(image.width)) ? image.width : null,
    height: (image.height && !Number.isNaN(image.height)) ? image.height : null,
  })));

  // Insert spell check errors
  if (result.spellCheck.errors.length > 0) {
    await db.insert(spellErrors).values(result.spellCheck.errors.map(error => ({
      emailId: email[0].id,
      word: error.word,
      position: error.position,
      suggestions: JSON.stringify(error.suggestions),
      context: error.context,
    })));
  }

  return result;
});
