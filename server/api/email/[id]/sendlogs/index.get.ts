import { eq } from "drizzle-orm";

import db from "@/lib/db/index";
import { sendlogAttachments } from "@/lib/db/schema/index";
import { routeParamsSchema } from "~/lib/validations";

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);

  const attachments = await db.query.sendlogAttachments.findMany({
    where: eq(sendlogAttachments.emailId, id),
    orderBy: (sendlogAttachments, { desc }) => [desc(sendlogAttachments.createdAt)],
  });

  return attachments;
});
