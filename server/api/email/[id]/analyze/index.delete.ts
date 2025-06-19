import { eq } from "drizzle-orm";

import db from "@/lib/db/index";
import { emails, images, links, qaChecklist, qaNotes, attachments, spellErrors } from "@/lib/db/schema/index";
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

  // Reset the email analysis status and clear related data
  await db.transaction(async (tx) => {
    // Delete all related analysis data
    await tx.delete(images).where(eq(images.emailId, id));
    await tx.delete(links).where(eq(links.emailId, id));
    await tx.delete(spellErrors).where(eq(spellErrors.emailId, id));
    await tx.delete(qaChecklist).where(eq(qaChecklist.emailId, id));
    await tx.delete(qaNotes).where(eq(qaNotes.emailId, id));
    await tx.delete(attachments).where(eq(attachments.emailId, id));

    // Reset email to unanalyzed state
    await tx.update(emails)
      .set({
        analyzed: false,
        screenshotUrl: null,
        screenshotDesktopUrl: null,
        screenshotMobileUrl: null,
        updatedAt: Date.now(),
      })
      .where(eq(emails.id, id));
  });

  return { success: true };
});
