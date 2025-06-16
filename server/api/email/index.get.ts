import db from "@/lib/db/index";
import { emails } from "@/lib/db/schema/index";

export default defineEventHandler(async () => {
  const result = await db.select().from(emails);
  return result;
});
