import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { emails } from "./emails";

export const qaNotes = sqliteTable("qa_notes", {
  id: integer().primaryKey({ autoIncrement: true }),
  emailId: integer().notNull().references(() => emails.id, { onDelete: "cascade" }),
  text: text().notNull(),
  createdAt: integer().notNull().$default(() => Date.now()),
  updatedAt: integer().notNull().$default(() => Date.now()).$onUpdate(() => Date.now()),
});

export const qaNotesRelations = relations(qaNotes, ({ one }) => ({
  email: one(emails, {
    fields: [qaNotes.emailId],
    references: [emails.id],
  }),
}));
