import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { emails } from "./emails";

export const qaChecklist = sqliteTable("qa_checklist", {
  id: integer().primaryKey({ autoIncrement: true }),
  emailId: integer().notNull().references(() => emails.id, { onDelete: "cascade" }),
  itemId: text().notNull(), // figma-design, url-validation, etc.
  itemText: text().notNull(),
  completed: integer({ mode: "boolean" }).notNull().default(false),
  note: text(),
  createdAt: integer().notNull().$default(() => Date.now()),
  updatedAt: integer().notNull().$default(() => Date.now()).$onUpdate(() => Date.now()),
});

export const qaChecklistRelations = relations(qaChecklist, ({ one }) => ({
  email: one(emails, {
    fields: [qaChecklist.emailId],
    references: [emails.id],
  }),
}));
