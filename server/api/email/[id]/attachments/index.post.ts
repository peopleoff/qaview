import { eq } from "drizzle-orm";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

import db from "@/lib/db/index";
import { attachments, emails } from "@/lib/db/schema/index";
import { routeParamsSchema } from "~/lib/validations";

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);

  // Check if email exists
  const email = await db.query.emails.findFirst({
    where: eq(emails.id, id),
  });

  if (!email) {
    throw createError({
      statusCode: 404,
      statusMessage: "Email not found",
    });
  }

  // Handle multipart form data
  const formData = await readMultipartFormData(event);

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No files uploaded",
    });
  }

  const uploadedFiles = [];

  for (const item of formData) {
    if (item.name === "files" && item.filename && item.data) {
      // Validate file type (images only)
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(item.type || "")) {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid file type: ${item.type}. Only images are allowed.`,
        });
      }

      // Validate file size (max 10MB)
      if (item.data.length > 10 * 1024 * 1024) {
        throw createError({
          statusCode: 400,
          statusMessage: "File too large. Maximum size is 10MB.",
        });
      }

      // Create unique filename
      const timestamp = Date.now();
      const fileExt = extname(item.filename);
      const uniqueFilename = `attachment-${id}-${timestamp}${fileExt}`;

      // Ensure upload directory exists
      const uploadDir = join(process.cwd(), "public/uploads/attachments");
      await mkdir(uploadDir, { recursive: true });

      // Save file
      const filePath = join(uploadDir, uniqueFilename);
      await writeFile(filePath, item.data);

      // Get description and type from form data
      const descriptionItem = formData.find(f => f.name === "description");
      const typeItem = formData.find(f => f.name === "type");
      const description = descriptionItem?.data?.toString() || null;
      const type = typeItem?.data?.toString() || "general";

      // Save to database
      const [attachment] = await db.insert(attachments).values({
        emailId: id,
        filename: uniqueFilename,
        originalName: item.filename,
        mimeType: item.type || "application/octet-stream",
        size: item.data.length,
        path: `/uploads/attachments/${uniqueFilename}`,
        description,
        type,
      }).returning();

      uploadedFiles.push(attachment);
    }
  }

  if (uploadedFiles.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No valid files found in upload",
    });
  }

  return {
    success: true,
    files: uploadedFiles,
  };
});
