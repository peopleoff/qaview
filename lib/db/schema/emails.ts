import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { attachments } from "./attachments";
import { images } from "./images";
import { links } from "./links";
import { qaChecklist } from "./qaChecklist";
import { qaNotes } from "./qaNotes";
import { spellErrors } from "./spellErrors";

export const emails = sqliteTable("emails", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  emailId: text("email_id"),
  filename: text("filename").notNull(),
  filePath: text("file_path").notNull(),
  subject: text("subject"),
  analyzed: integer("analyzed", { mode: "boolean" }).default(false),
  screenshotUrl: text("screenshot_url"),
  screenshotDesktopUrl: text("screenshot_desktop_url"),
  screenshotMobileUrl: text("screenshot_mobile_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const emailsRelations = relations(emails, ({ many }) => ({
  links: many(links),
  images: many(images),
  spellErrors: many(spellErrors),
  qaChecklist: many(qaChecklist),
  qaNotes: many(qaNotes),
  attachments: many(attachments),
}));

// Type exports for TypeScript
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
