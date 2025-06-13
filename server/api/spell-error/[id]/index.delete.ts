import { eq } from "drizzle-orm";

import db from "@/lib/db/index";
import { spellErrors } from "@/lib/db/schema/index";
import { routeParamsSchema } from "~/lib/validations";

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);

  const result = await db.delete(spellErrors)
    .where(eq(spellErrors.id, id))
    .returning();

  if (result.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Spell error not found",
    });
  }

  return { success: true };
});
