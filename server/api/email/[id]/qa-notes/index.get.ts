import { eq } from "drizzle-orm";

import db from "~/lib/db";
import { qaNotes } from "~/lib/db/schema";
import { routeParamsSchema } from "~/lib/validations";

export default defineEventHandler(async (event) => {
  const { id: emailId } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);

  const notes = await db
    .select()
    .from(qaNotes)
    .where(eq(qaNotes.emailId, emailId))
    .orderBy(qaNotes.createdAt);

  return notes;
});
