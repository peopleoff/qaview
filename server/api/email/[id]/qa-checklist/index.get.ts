import { eq } from "drizzle-orm";

import db from "~/lib/db";
import { qaChecklist } from "~/lib/db/schema";
import { routeParamsSchema } from "~/lib/validations";

export default defineEventHandler(async (event) => {
  const { id: emailId } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);

  const items = await db
    .select()
    .from(qaChecklist)
    .where(eq(qaChecklist.emailId, emailId))
    .orderBy(qaChecklist.createdAt);

  return items;
});
