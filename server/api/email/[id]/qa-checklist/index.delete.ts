import { and, eq } from "drizzle-orm";
import { z } from "zod";

import db from "~/lib/db";
import { qaChecklist } from "~/lib/db/schema";
import { qaChecklistItemIdSchema, routeParamsSchema } from "~/lib/validations";

const querySchema = z.object({
  itemId: qaChecklistItemIdSchema,
});

export default defineEventHandler(async (event) => {
  const { id: emailId } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);
  const { itemId } = await getValidatedQuery(event, querySchema.parseAsync);

  await db
    .delete(qaChecklist)
    .where(and(eq(qaChecklist.emailId, emailId), eq(qaChecklist.itemId, itemId)));

  return { success: true };
});
