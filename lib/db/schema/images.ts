import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { emails } from "./emails";

export const images = sqliteTable("images", {
  id: integer().primaryKey({ autoIncrement: true }),
  emailId: integer().references(() => emails.id, { onDelete: "cascade" }),
  src: text(),
  alt: text(),
  status: integer(),
  height: integer(),
  width: integer(),
  createdAt: integer().notNull().$default(() => Date.now()),
  updatedAt: integer().notNull().$default(() => Date.now()).$onUpdate(() => Date.now()),
});

export const imagesRelations = relations(images, ({ one }) => ({
  email: one(emails, {
    fields: [images.emailId],
    references: [emails.id],
  }),
}));
