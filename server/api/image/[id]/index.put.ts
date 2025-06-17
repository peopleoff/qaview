import { eq } from "drizzle-orm";
import { z } from "zod";

import db from "~/lib/db";
import { images } from "~/lib/db/schema";

const updateImageSchema = z.object({
  alt: z.string().min(1, "Alt text is required"),
  src: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  width: z.number().min(1, "Width must be greater than 0").optional(),
  height: z.number().min(1, "Height must be greater than 0").optional(),
});

export default defineEventHandler(async (event) => {
  const imageId = getRouterParam(event, "id");

  if (!imageId || Number.isNaN(Number(imageId))) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid image ID",
    });
  }

  const body = await readBody(event);

  try {
    const validatedData = updateImageSchema.parse(body);

    const [updatedImage] = await db
      .update(images)
      .set({
        alt: validatedData.alt,
        src: validatedData.src || null,
        width: validatedData.width || null,
        height: validatedData.height || null,
        isEdited: 1,
        updatedAt: Date.now(),
      })
      .where(eq(images.id, Number(imageId)))
      .returning();

    if (!updatedImage) {
      throw createError({
        statusCode: 404,
        statusMessage: "Image not found",
      });
    }

    return updatedImage;
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
      statusMessage: "Failed to update image",
    });
  }
});
