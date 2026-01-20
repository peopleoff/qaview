import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join } from "path";
import { app } from "electron";
import * as schema from "./schema";

// Get the user data directory for storing the database
// In development, this will be in your local app data
// In production, it will be in the user's app data folder
const userDataPath = app.getPath("userData");
const dbPath = join(userDataPath, "qaview.db");

// Create SQLite database instance
const sqlite = new Database(dbPath);

// Create Drizzle ORM instance
export const db = drizzle(sqlite, { schema, casing: "snake_case" });

export { schema };
