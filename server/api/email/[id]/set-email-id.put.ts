import { eq } from "drizzle-orm";
import { z } from "zod";

import db from "@/lib/db/index";
import { emails } from "@/lib/db/schema/index";
import { routeParamsSchema } from "~/lib/validations";

const setEmailIdSchema = z.object({
  emailId: z.string().min(1, "Email ID is required"),
});

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);
  const body = await readBody(event);
  const { emailId } = await setEmailIdSchema.parseAsync(body);

  // Check if email exists
  const email = await db.select().from(emails).where(eq(emails.id, id)).limit(1);
  if (!email[0]) {
    throw createError({
      statusCode: 404,
      statusMessage: "Email not found",
    });
  }

  // Update the email with the selected emailId
  await db.update(emails).set({
    emailId,
    updatedAt: Date.now(),
  }).where(eq(emails.id, id));

  return {
    success: true,
    message: `Email ID set to "${emailId}"`,
    emailId,
  };
});