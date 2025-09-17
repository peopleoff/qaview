import { eq } from "drizzle-orm";
import { z } from "zod";

import db from "@/lib/db/index";
import { emails } from "@/lib/db/schema/index";
import { routeParamsSchema } from "~/lib/validations";

const updateMetadataSchema = z.object({
  emailId: z.string().optional(),
  subject: z.string().optional(),
}).refine(data => data.emailId !== undefined || data.subject !== undefined, {
  message: "At least one field (emailId or subject) must be provided",
});

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);
  const body = await readBody(event);
  const updateData = await updateMetadataSchema.parseAsync(body);

  // Check if email exists
  const email = await db.select().from(emails).where(eq(emails.id, id)).limit(1);
  if (!email[0]) {
    throw createError({
      statusCode: 404,
      statusMessage: "Email not found",
    });
  }

  // Prepare update object
  const updates: Partial<typeof emails.$inferInsert> = {
    updatedAt: Date.now(),
  };

  if (updateData.emailId !== undefined) {
    updates.emailId = updateData.emailId.trim() || null;
  }

  if (updateData.subject !== undefined) {
    updates.subject = updateData.subject.trim() || null;
  }

  // Update the email
  await db.update(emails).set(updates).where(eq(emails.id, id));

  // Get updated email data
  const updatedEmail = await db.select().from(emails).where(eq(emails.id, id)).limit(1);

  return {
    success: true,
    message: "Email metadata updated successfully",
    data: {
      emailId: updatedEmail[0].emailId,
      subject: updatedEmail[0].subject,
    },
  };
});