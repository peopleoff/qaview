import { eq } from "drizzle-orm";

import db from "@/lib/db/index";
import { emails } from "@/lib/db/schema/index";
import { routeParamsSchema } from "~/lib/validations";

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);
  const result = await db.query.emails.findFirst({
    where: eq(emails.id, id),
    with: {
      links: true,
      images: true,
      spellErrors: true,
      qaChecklist: true,
      qaNotes: true,
      sendlogAttachments: true,
    },
  });

  if (!result) {
    throw createError({
      statusCode: 404,
      statusMessage: "Email not found",
    });
  }

  return result;
});
