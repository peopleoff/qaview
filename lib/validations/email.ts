import { z } from "zod";

import { nonEmptyStringSchema, optionalStringSchema } from "./common";

// Email upload validation
export const emailUploadSchema = z.object({
  filename: nonEmptyStringSchema,
  size: z.number().positive("File size must be positive"),
  type: z.string().refine(
    type => type === "message/rfc822" || type === "text/plain" || type.startsWith("application/"),
    "Invalid email file type",
  ),
});

// Email creation validation
export const createEmailSchema = z.object({
  filename: nonEmptyStringSchema,
  filePath: nonEmptyStringSchema,
  subject: optionalStringSchema,
});

// Email update validation
export const updateEmailSchema = z.object({
  subject: optionalStringSchema,
  emailId: optionalStringSchema,
  analyzed: z.boolean().optional(),
  screenshotUrl: optionalStringSchema,
});

// Export types
export type EmailUpload = z.infer<typeof emailUploadSchema>;
export type CreateEmail = z.infer<typeof createEmailSchema>;
export type UpdateEmail = z.infer<typeof updateEmailSchema>;
