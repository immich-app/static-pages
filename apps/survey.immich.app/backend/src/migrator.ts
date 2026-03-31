import { Migrator, type Migration, type MigrationProvider, sql, type Kysely } from 'kysely';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Database } from './db';

class SqlFileMigrationProvider implements MigrationProvider {
  constructor(private migrationsDir: string) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const files = await readdir(this.migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();
    const migrations: Record<string, Migration> = {};

    for (const file of sqlFiles) {
      const name = file.replace('.sql', '');
      const content = await readFile(join(this.migrationsDir, file), 'utf-8');
      migrations[name] = {
        async up(db: Kysely<any>) {
          const statements = content
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean);
          for (const stmt of statements) {
            await sql.raw(stmt).execute(db);
          }
        },
      };
    }
    return migrations;
  }
}

export async function runMigrations(db: Kysely<Database>, migrationsDir: string): Promise<void> {
  const migrator = new Migrator({
    db,
    provider: new SqlFileMigrationProvider(migrationsDir),
  });

  const { error, results } = await migrator.migrateToLatest();

  if (results) {
    for (const result of results) {
      if (result.status === 'Success') {
        console.log(`Migration ${result.migrationName}: applied`);
      } else if (result.status === 'Error') {
        console.error(`Migration ${result.migrationName}: failed`);
      }
    }
  }

  if (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
