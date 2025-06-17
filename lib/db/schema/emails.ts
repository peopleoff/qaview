import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { attachments } from "./attachments";
import { images } from "./images";
import { links } from "./links";
import { qaChecklist } from "./qaChecklist";
import { qaNotes } from "./qaNotes";
import { spellErrors } from "./spellErrors";

export const emails = sqliteTable("emails", {
  id: integer().primaryKey({ autoIncrement: true }),
  filename: text().notNull(),
  filePath: text().notNull(),
  subject: text(),
  analyzed: integer({ mode: "boolean" }).notNull().default(false),
  screenshotUrl: text(), // Legacy field - kept for backward compatibility
  screenshotDesktopUrl: text(),
  screenshotMobileUrl: text(),
  createdAt: integer().notNull().$default(() => Date.now()),
  updatedAt: integer().notNull().$default(() => Date.now()).$onUpdate(() => Date.now()),
});

export const emailsRelations = relations(emails, ({ many }) => ({
  links: many(links),
  images: many(images),
  spellErrors: many(spellErrors),
  qaChecklist: many(qaChecklist),
  qaNotes: many(qaNotes),
  attachments: many(attachments),
}));
