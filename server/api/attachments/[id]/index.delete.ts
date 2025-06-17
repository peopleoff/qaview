import { eq } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import { join } from "node:path";

import db from "@/lib/db/index";
import { attachments } from "@/lib/db/schema/index";
import { routeParamsSchema } from "~/lib/validations";

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);

  // Get attachment details
  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, id),
  });

  if (!attachment) {
    throw createError({
      statusCode: 404,
      statusMessage: "Attachment not found",
    });
  }

  // Delete file from filesystem
  try {
    const filePath = join(process.cwd(), "public", attachment.path);
    await unlink(filePath);
  }
  catch (error) {
    console.error("Failed to delete file:", error);
    // Continue with database deletion even if file deletion fails
  }

  // Delete from database
  await db.delete(attachments).where(eq(attachments.id, id));

  return { success: true };
});
