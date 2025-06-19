import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { emails } from "./emails";

export const attachments = sqliteTable("attachments", {
  id: integer().primaryKey({ autoIncrement: true }),
  emailId: integer().notNull().references(() => emails.id, { onDelete: "cascade" }),
  filename: text().notNull(),
  originalName: text().notNull(),
  mimeType: text().notNull(),
  size: integer().notNull(),
  path: text().notNull(),
  description: text(),
  type: text().default("general"),
  isEdited: integer().default(0),
  createdAt: integer().notNull().$default(() => Date.now()),
  updatedAt: integer().notNull().$default(() => Date.now()).$onUpdate(() => Date.now()),
});

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  email: one(emails, {
    fields: [attachments.emailId],
    references: [emails.id],
  }),
}));
