import { z } from "zod";

import { nonEmptyStringSchema, optionalStringSchema } from "./common";

// QA checklist item validation schemas
export const qaChecklistItemIdSchema = z.enum([
  "figma-design",
  "url-validation",
  "utm-parameters",
  "personalization",
  "automation-documentation",
  "developer-comments",
  "send-log-validation",
  "documentation-screenshots",
]);

// Create QA checklist item validation
export const createQaChecklistItemSchema = z.object({
  itemId: qaChecklistItemIdSchema,
  itemText: nonEmptyStringSchema,
  completed: z.boolean().default(false),
  note: optionalStringSchema,
});

// Update QA checklist item validation
export const updateQaChecklistItemSchema = z.object({
  itemText: nonEmptyStringSchema.optional(),
  completed: z.boolean().optional(),
  note: optionalStringSchema,
});

// Default checklist items (for initialization)
export const defaultChecklistItems = [
  {
    id: "figma-design" as const,
    text: "Does every client design match figma design",
  },
  {
    id: "url-validation" as const,
    text: "Does every url work and do they go to the expected place",
  },
  {
    id: "utm-parameters" as const,
    text: "Are UTM's populating with the expected parameters",
  },
  {
    id: "personalization" as const,
    text: "Is all personalization correct",
  },
  {
    id: "automation-documentation" as const,
    text: "Document each step of the automation and journey, what it's doing and the expected results",
  },
  {
    id: "developer-comments" as const,
    text: "Ensure that developer is documenting their work with comments",
  },
  {
    id: "send-log-validation" as const,
    text: "Validate the SMS/Email send log and ensure that confirmationNumber, SubKey, raNumber, email/SMS name/id, and brand is being logged",
  },
  {
    id: "documentation-screenshots" as const,
    text: "Document all these steps, add screenshots if applicable",
  },
] as const;

// Export types
export type QaChecklistItemId = z.infer<typeof qaChecklistItemIdSchema>;
export type CreateQaChecklistItem = z.infer<typeof createQaChecklistItemSchema>;
export type UpdateQaChecklistItem = z.infer<typeof updateQaChecklistItemSchema>;
export type DefaultChecklistItem = typeof defaultChecklistItems[number];
