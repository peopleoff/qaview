import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { app } from 'electron';

export function runMigrations(dbPath: string) {
  console.log('Running database migrations...');
  console.log('Database path:', dbPath);

  // Create database connection
  const sqlite = new Database(dbPath);

  try {
    // Check if migrations have already been run
    const tables = sqlite.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='emails'"
    ).all();

    if (tables.length > 0) {
      console.log('Database already migrated, skipping...');
      return;
    }

    // Determine migrations folder path
    let migrationsFolder: string;

    if (app.isPackaged) {
      // In production, migrations are in the app.asar resources
      migrationsFolder = join(process.resourcesPath, 'lib/db/migrations');
    } else {
      // In development, find migrations from project root
      // dist-electron/main.js -> project root -> lib/db/migrations
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const projectRoot = join(__dirname, '..');
      migrationsFolder = join(projectRoot, 'lib/db/migrations');
    }

    console.log('Migrations folder:', migrationsFolder);

    // Read and execute the migration SQL file
    const migrationSQL = readFileSync(join(migrationsFolder, '0000_brief_vance_astro.sql'), 'utf-8');

    // Execute the migration
    sqlite.exec(migrationSQL);

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    sqlite.close();
  }
}
