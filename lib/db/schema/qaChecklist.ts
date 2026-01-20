import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { emails } from "./emails";

export const qaChecklist = sqliteTable("qa_checklist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  emailId: integer("email_id")
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(),
  itemText: text("item_text").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const qaChecklistRelations = relations(qaChecklist, ({ one }) => ({
  email: one(emails, {
    fields: [qaChecklist.emailId],
    references: [emails.id],
  }),
}));

// Type exports for TypeScript
export type QAChecklistItem = typeof qaChecklist.$inferSelect;
export type NewQAChecklistItem = typeof qaChecklist.$inferInsert;
