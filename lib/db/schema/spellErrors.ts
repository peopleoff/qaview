import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { emails } from "./emails";

export const spellErrors = sqliteTable("spell_errors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  emailId: integer("email_id")
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  word: text("word"),
  position: integer("position"),
  suggestions: text("suggestions"),
  context: text("context"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const spellErrorsRelations = relations(spellErrors, ({ one }) => ({
  email: one(emails, {
    fields: [spellErrors.emailId],
    references: [emails.id],
  }),
}));

// Type exports for TypeScript
export type SpellError = typeof spellErrors.$inferSelect;
export type NewSpellError = typeof spellErrors.$inferInsert;
