import { eq } from "drizzle-orm";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

import db from "~/lib/db";
import { links } from "~/lib/db/schema";

const updateLinkSchema = z.object({
  text: z.string().min(1, "Link text is required"),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  finalUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.number().min(0).max(599).optional(),
});

export default defineEventHandler(async (event) => {
  const linkId = getRouterParam(event, "id");

  if (!linkId || Number.isNaN(Number(linkId))) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid link ID",
    });
  }

  try {
    // Get the existing link to access emailId
    const [existingLink] = await db
      .select()
      .from(links)
      .where(eq(links.id, Number(linkId)));

    if (!existingLink) {
      throw createError({
        statusCode: 404,
        statusMessage: "Link not found",
      });
    }

    // Handle multipart form data
    const formData = await readMultipartFormData(event);

    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: "No form data provided",
      });
    }

    // Extract JSON data
    const dataField = formData.find(field => field.name === "data");
    if (!dataField) {
      throw createError({
        statusCode: 400,
        statusMessage: "No data field provided",
      });
    }

    const validatedData = updateLinkSchema.parse(JSON.parse(dataField.data.toString()));

    // Handle file upload and removal
    let screenshotPath = existingLink.screenshotPath;
    const screenshotField = formData.find(field => field.name === "screenshot");
    const removeImageField = formData.find(field => field.name === "removeImage");

    if (removeImageField && removeImageField.data.toString() === "true") {
      // User wants to remove the image
      screenshotPath = null;
    }
    else if (screenshotField && screenshotField.filename) {
      // User is uploading a new image
      const uploadDir = join(process.cwd(), "public", "uploads", "analysis", `email-${existingLink.emailId}`);

      // Ensure directory exists
      await mkdir(uploadDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = screenshotField.filename.split(".").pop();
      const filename = `link-${linkId}-${timestamp}.${fileExtension}`;
      const filePath = join(uploadDir, filename);

      // Write file
      await writeFile(filePath, screenshotField.data);
      screenshotPath = filename;
    }

    const [updatedLink] = await db
      .update(links)
      .set({
        text: validatedData.text,
        url: validatedData.url || null,
        finalUrl: validatedData.finalUrl || null,
        status: validatedData.status || null,
        screenshotPath,
        isEdited: 1,
        updatedAt: Date.now(),
      })
      .where(eq(links.id, Number(linkId)))
      .returning();

    return updatedLink;
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation failed",
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update link",
    });
  }
});
