import { and, eq } from "drizzle-orm";

import db from "~/lib/db";
import { qaChecklist } from "~/lib/db/schema";
import {
  createQaChecklistItemSchema,
  routeParamsSchema,
} from "~/lib/validations";

export default defineEventHandler(async (event) => {
  const { id: emailId } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);
  const { itemId, itemText, completed, note } = await readValidatedBody(event, createQaChecklistItemSchema.parseAsync);

  // Check if item already exists for this email
  const existingItem = await db
    .select()
    .from(qaChecklist)
    .where(and(eq(qaChecklist.emailId, emailId), eq(qaChecklist.itemId, itemId)))
    .limit(1);

  if (existingItem.length > 0) {
    // Update existing item
    const [updatedItem] = await db
      .update(qaChecklist)
      .set({
        itemText,
        completed: Boolean(completed),
        note: note || null,
        updatedAt: Date.now(),
      })
      .where(and(eq(qaChecklist.emailId, emailId), eq(qaChecklist.itemId, itemId)))
      .returning();

    return updatedItem;
  }
  else {
    // Create new item
    const [newItem] = await db
      .insert(qaChecklist)
      .values({
        emailId,
        itemId,
        itemText,
        completed: Boolean(completed),
        note: note || null,
      })
      .returning();

    return newItem;
  }
});
