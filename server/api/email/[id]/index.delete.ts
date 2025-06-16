import { eq } from "drizzle-orm";

import db from "@/lib/db/index";
import { emails } from "@/lib/db/schema/index";
import { routeParamsSchema } from "~/lib/validations";

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);
  const result = await db.delete(emails).where(eq(emails.id, id));

  if (!result) {
    throw createError({
      statusCode: 404,
      statusMessage: "Email not found",
    });
  }

  return result;
});
