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
  await db.update(emails).set({
    analyzed: true,
    subject: parsed.subject || null,
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
