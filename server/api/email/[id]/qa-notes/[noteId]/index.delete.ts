import { and, eq } from "drizzle-orm";
import { z } from "zod";

import db from "~/lib/db";
import { qaNotes } from "~/lib/db/schema";
import { idSchema } from "~/lib/validations";

const paramsSchema = z.object({
  id: idSchema,
  noteId: idSchema,
});

export default defineEventHandler(async (event) => {
  const { id: emailId, noteId } = await getValidatedRouterParams(event, paramsSchema.parseAsync);

  await db
    .delete(qaNotes)
    .where(and(eq(qaNotes.id, noteId), eq(qaNotes.emailId, emailId)));

  return { success: true };
});
