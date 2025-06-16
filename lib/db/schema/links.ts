import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { emails } from "./emails";

export const links = sqliteTable("links", {
  id: integer().primaryKey({ autoIncrement: true }),
  emailId: integer().references(() => emails.id, { onDelete: "cascade" }),
  text: text(),
  url: text(),
  status: integer(),
  screenshotUrl: text(),
  redirectChain: text({ mode: "json" }),
  finalUrl: text(),
  utmParams: text({ mode: "json" }),
  screenshotPath: text(),
  createdAt: integer().notNull().$default(() => Date.now()),
  updatedAt: integer().notNull().$default(() => Date.now()).$onUpdate(() => Date.now()),
});

export const linksRelations = relations(links, ({ one }) => ({
  email: one(emails, {
    fields: [links.emailId],
    references: [emails.id],
  }),
}));
