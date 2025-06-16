import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { emails } from "./emails";

export const spellErrors = sqliteTable("spell_errors", {
  id: integer().primaryKey({ autoIncrement: true }),
  emailId: integer().notNull().references(() => emails.id, { onDelete: "cascade" }),
  word: text().notNull(),
  position: integer().notNull(),
  suggestions: text().notNull(), // JSON string of suggestions array
  context: text().notNull(),
  createdAt: integer().notNull().$default(() => Date.now()),
  updatedAt: integer().notNull().$default(() => Date.now()).$onUpdate(() => Date.now()),
});

export const spellErrorsRelations = relations(spellErrors, ({ one }) => ({
  email: one(emails, {
    fields: [spellErrors.emailId],
    references: [emails.id],
  }),
}));
