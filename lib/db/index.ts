import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join, dirname } from "path";
import { fileURLToPath } from 'url';
import { app } from "electron";
import { readFileSync, existsSync } from 'fs';
import * as schema from "./schema";

// Get the user data directory for storing the database
const userDataPath = app.getPath("userData");
const dbPath = join(userDataPath, "qaview.db");

// Create SQLite database instance
const sqlite = new Database(dbPath);

// Run migrations if needed (synchronous, before any queries)
const hasEmailsTable = sqlite.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='emails'"
).all().length > 0;

if (!hasEmailsTable) {
  console.log('First run detected, running database migrations...');

  let migrationsFolder: string;
  if (app.isPackaged) {
    // In production, migrations are inside the asar archive
    // app.getAppPath() returns path to the asar contents
    migrationsFolder = join(app.getAppPath(), 'lib/db/migrations');
  } else {
    // In development, compiled code runs from dist-electron/
    // Go up one level to project root, then into lib/db/migrations
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const projectRoot = join(__dirname, '..');
    migrationsFolder = join(projectRoot, 'lib/db/migrations');
  }

  const migrationFile = join(migrationsFolder, '0000_brief_vance_astro.sql');
  if (existsSync(migrationFile)) {
    const sql = readFileSync(migrationFile, 'utf-8');
    sqlite.exec(sql);
    console.log('Database migrations completed successfully');
  } else {
    console.error('Migration file not found:', migrationFile);
  }
}

// Create Drizzle ORM instance
export const db = drizzle(sqlite, { schema, casing: "snake_case" });

export { schema };
