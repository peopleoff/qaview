import { z } from "zod";

// Common ID validation
export const idSchema = z.coerce.number().positive("ID must be a positive number");

// Text validation helpers
export const nonEmptyStringSchema = z.string().min(1, "This field is required").trim();
export const optionalStringSchema = z.string().trim().optional().nullable();

// Route param validation
export const routeParamsSchema = z.object({
  id: idSchema,
});

export type IdSchema = z.infer<typeof idSchema>;
export type RouteParams = z.infer<typeof routeParamsSchema>;
