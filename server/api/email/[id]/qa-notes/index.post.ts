import db from "~/lib/db";
import { qaNotes } from "~/lib/db/schema";
import { createQaNoteSchema, routeParamsSchema } from "~/lib/validations";

export default defineEventHandler(async (event) => {
  const { id: emailId } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);
  const { text } = await readValidatedBody(event, createQaNoteSchema.parseAsync);

  const [newNote] = await db
    .insert(qaNotes)
    .values({
      emailId,
      text: text.trim(),
    })
    .returning();

  return newNote;
});
