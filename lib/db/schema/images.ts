import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { emails } from "./emails";

export const images = sqliteTable("images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  emailId: integer("email_id")
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  src: text("src"),
  alt: text("alt"),
  status: integer("status"),
  height: integer("height"),
  width: integer("width"),
  isEdited: integer("is_edited").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const imagesRelations = relations(images, ({ one }) => ({
  email: one(emails, {
    fields: [images.emailId],
    references: [emails.id],
  }),
}));

// Type exports for TypeScript
export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
