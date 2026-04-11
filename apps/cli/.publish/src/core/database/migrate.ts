import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPostgresClient } from './postgres-client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface MigrationResult {
  success: boolean;
  appliedCount: number;
  failedMigrations: string[];
  errors: Error[];
}

/**
 * Get all migration files sorted chronologically
 */
export function getMigrationFiles(migrationsDir: string): string[] {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql') || f.endsWith('.ts'))
    .sort();
}

/**
 * Run a single migration file
 */
export async function runMigration(client: any, filePath: string): Promise<void> {
  const ext = path.extname(filePath);

  if (ext === '.sql') {
    const sql = fs.readFileSync(filePath, 'utf-8');
    if (sql.trim()) {
      // Split by semicolon to execute statements individually
      const statements = sql.split(';').filter((stmt) => stmt.trim());
      for (const stmt of statements) {
        if (stmt.trim()) {
          await client.query(stmt);
        }
      }
    }
  } else if (ext === '.ts') {
    // Support TypeScript migrations (e.g., data seeding)
    const module = await import(`file://${filePath}`);
    if (module.up) {
      await module.up(client);
    }
  }
}

/**
 * Run all migrations
 */
export async function runMigrations(
  migrationsDir: string = path.join(__dirname, 'migrations')
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    appliedCount: 0,
    failedMigrations: [],
    errors: [],
  };

  try {
    const client = getPostgresClient();
    await client.init();

    if (client.isFallbackMode()) {
      console.warn('[migrator] Migrations skipped: database in fallback mode');
      return result;
    }

    const migrationFiles = getMigrationFiles(migrationsDir);

    if (migrationFiles.length === 0) {
      console.info('[migrator] No migration files found');
      return result;
    }

    console.info(`[migrator] Found ${migrationFiles.length} migration(s)`);

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      try {
        console.info(`[migrator] Applying migration: ${file}`);
        await runMigration(client, filePath);
        result.appliedCount++;
        console.info(`[migrator] ✓ Migration applied: ${file}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[migrator] ✗ Migration failed: ${file}`, error);
        result.failedMigrations.push(file);
        result.errors.push(error instanceof Error ? error : new Error(errorMessage));
        result.success = false;
      }
    }

    if (result.success) {
      console.info(`[migrator] All ${result.appliedCount} migration(s) applied successfully`);
    } else {
      console.error(
        `[migrator] Migration completed with errors: ${result.failedMigrations.length} failed`
      );
    }

    return result;
  } catch (error) {
    console.error('[migrator] Fatal migration error:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error : new Error(String(error)));
    return result;
  }
}

/**
 * CLI entry point for migrations
 */
export async function main(): Promise<void> {
  const migrationsDir =
    process.argv[2] || path.join(__dirname, 'migrations');

  const result = await runMigrations(migrationsDir);

  if (!result.success) {
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
