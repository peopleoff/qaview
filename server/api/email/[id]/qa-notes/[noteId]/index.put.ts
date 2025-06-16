import { and, eq } from "drizzle-orm";
import { z } from "zod";

import db from "~/lib/db";
import { qaNotes } from "~/lib/db/schema";
import { idSchema, updateQaNoteSchema } from "~/lib/validations";

const paramsSchema = z.object({
  id: idSchema,
  noteId: idSchema,
});

export default defineEventHandler(async (event) => {
  const { id: emailId, noteId } = await getValidatedRouterParams(event, paramsSchema.parseAsync);
  const { text } = await readValidatedBody(event, updateQaNoteSchema.parseAsync);

  const [updatedNote] = await db
    .update(qaNotes)
    .set({
      text: text.trim(),
      updatedAt: Date.now(),
    })
    .where(and(eq(qaNotes.id, noteId), eq(qaNotes.emailId, emailId)))
    .returning();

  if (!updatedNote) {
    throw createError({
      statusCode: 404,
      statusMessage: "Note not found",
    });
  }

  return updatedNote;
});
