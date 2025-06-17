import { eq } from "drizzle-orm";

import db from "@/lib/db/index";
import { attachments } from "@/lib/db/schema/index";
import { routeParamsSchema } from "~/lib/validations";

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);

  const emailAttachments = await db.query.attachments.findMany({
    where: eq(attachments.emailId, id),
    orderBy: (attachments, { desc }) => [desc(attachments.createdAt)],
  });

  return emailAttachments;
});
