import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { emails } from "./emails";

export const qaNotes = sqliteTable("qa_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  emailId: integer("email_id")
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const qaNotesRelations = relations(qaNotes, ({ one }) => ({
  email: one(emails, {
    fields: [qaNotes.emailId],
    references: [emails.id],
  }),
}));

// Type exports for TypeScript
export type QANote = typeof qaNotes.$inferSelect;
export type NewQANote = typeof qaNotes.$inferInsert;
