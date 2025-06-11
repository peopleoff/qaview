import { z } from "zod";

import { nonEmptyStringSchema } from "./common";

// QA notes validation schemas

// Create QA note validation
export const createQaNoteSchema = z.object({
  text: nonEmptyStringSchema.min(1, "Note text cannot be empty").max(5000, "Note text cannot exceed 5000 characters"),
});

// Update QA note validation
export const updateQaNoteSchema = z.object({
  text: nonEmptyStringSchema.min(1, "Note text cannot be empty").max(5000, "Note text cannot exceed 5000 characters"),
});

// Export types
export type CreateQaNote = z.infer<typeof createQaNoteSchema>;
export type UpdateQaNote = z.infer<typeof updateQaNoteSchema>;
