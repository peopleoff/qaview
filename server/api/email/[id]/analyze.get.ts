import { eq } from "drizzle-orm";
import { simpleParser } from "mailparser";
import { readFile } from "node:fs/promises";
import { z } from "zod";

import db from "@/lib/db/index";
import { emails, images, links } from "@/lib/db/schema/index";
import { analyzeEmailContent } from "@/server/utils/email-analyzer";

const getSchema = z.object({
  id: z.coerce.number(),
}).parseAsync;

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, getSchema);
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
    screenshotUrl: result.screenshots.fullPage,
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
  return result;
});
