import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { emails } from "./emails";

export const links = sqliteTable("links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  emailId: integer("email_id")
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  text: text("text"),
  url: text("url"),
  status: integer("status"),
  screenshotUrl: text("screenshot_url"),
  redirectChain: text("redirect_chain", { mode: "json" }),
  finalUrl: text("final_url"),
  utmParams: text("utm_params", { mode: "json" }),
  screenshotPath: text("screenshot_path"),
  isEdited: integer("is_edited").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const linksRelations = relations(links, ({ one }) => ({
  email: one(emails, {
    fields: [links.emailId],
    references: [emails.id],
  }),
}));

// UTM parameters interface
export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  [key: string]: string | undefined;
}

// Type exports for TypeScript
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;

// Helper type for Link with typed UTM params
export type LinkWithUtmParams = Omit<Link, 'utmParams'> & {
  utmParams: UtmParams | null;
};
