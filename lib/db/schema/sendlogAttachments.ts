import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { emails } from "./emails";

export const sendlogAttachments = sqliteTable("sendlog_attachments", {
  id: integer().primaryKey({ autoIncrement: true }),
  emailId: integer().notNull().references(() => emails.id, { onDelete: "cascade" }),
  filename: text().notNull(),
  originalName: text().notNull(),
  mimeType: text().notNull(),
  size: integer().notNull(),
  path: text().notNull(),
  description: text(),
  createdAt: integer().notNull().$default(() => Date.now()),
  updatedAt: integer().notNull().$default(() => Date.now()).$onUpdate(() => Date.now()),
});

export const sendlogAttachmentsRelations = relations(sendlogAttachments, ({ one }) => ({
  email: one(emails, {
    fields: [sendlogAttachments.emailId],
    references: [emails.id],
  }),
}));
