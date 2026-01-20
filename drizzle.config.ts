import { defineConfig } from "drizzle-kit";
import { join } from "path";
import { homedir } from "os";

export default defineConfig({
  out: "./lib/db/migrations",
  schema: "./lib/db/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: join(homedir(), "Library/Application Support/qaview-desktop/qaview.db"),
  },
  casing: "snake_case",
});
