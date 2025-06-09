import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { images } from "./images";
import { links } from "./links";

export const emails = sqliteTable("emails", {
  id: integer().primaryKey({ autoIncrement: true }),
  filename: text().notNull(),
  filePath: text().notNull(),
  subject: text(),
  analyzed: integer({ mode: "boolean" }).notNull().default(false),
  screenshotUrl: text(),
  createdAt: integer().notNull().$default(() => Date.now()),
  updatedAt: integer().notNull().$default(() => Date.now()).$onUpdate(() => Date.now()),
});

export const emailsRelations = relations(emails, ({ many }) => ({
  links: many(links),
  images: many(images),
}));
