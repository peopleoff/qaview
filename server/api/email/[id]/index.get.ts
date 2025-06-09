import { eq } from "drizzle-orm";
import { z } from "zod";

import db from "@/lib/db/index";
import { emails } from "@/lib/db/schema/index";

const getSchema = z.object({
  id: z.coerce.number(),
}).parseAsync;

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, getSchema);
  const result = await db.query.emails.findFirst({
    where: eq(emails.id, id),
    with: {
      links: true,
      images: true,
    },
  });
  return result;
});
