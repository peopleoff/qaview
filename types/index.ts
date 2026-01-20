/**
 * Central export for all application types.
 */

// IPC response types
export * from "./ipc";

// Utility types and functions
export * from "./utils";

// Progress event types
export * from "./progress";

// Re-export Drizzle schema types for convenience
export type {
  Email,
  NewEmail,
} from "../lib/db/schema/emails";

export type {
  Link,
  NewLink,
  UtmParams,
  LinkWithUtmParams,
} from "../lib/db/schema/links";

export type {
  Image,
  NewImage,
} from "../lib/db/schema/images";

export type {
  QAChecklistItem,
  NewQAChecklistItem,
} from "../lib/db/schema/qaChecklist";

export type {
  QANote,
  NewQANote,
} from "../lib/db/schema/qaNotes";

export type {
  Attachment,
  NewAttachment,
} from "../lib/db/schema/attachments";

export type {
  SpellError,
  NewSpellError,
} from "../lib/db/schema/spellErrors";
