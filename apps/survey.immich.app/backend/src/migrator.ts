import { Migrator, type Migration, type MigrationProvider, sql, type Kysely } from 'kysely';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Database } from './db';

/**
 * Split a SQL script into individual statements on top-level semicolons,
 * ignoring semicolons inside single-quoted string literals, line comments
 * (`-- …`), and block comments (`/* … *\/`). Naive split on `;` alone would
 * break on trigger bodies or any literal containing a semicolon.
 */
function splitSqlStatements(script: string): string[] {
  const statements: string[] = [];
  let current = '';
  let i = 0;
  while (i < script.length) {
    const ch = script[i];
    const next = script[i + 1];

    if (ch === "'") {
      // Single-quoted string — consume until closing quote, honouring `''` escape
      current += ch;
      i++;
      while (i < script.length) {
        const c = script[i];
        current += c;
        i++;
        if (c === "'") {
          if (script[i] === "'") {
            current += script[i];
            i++;
            continue;
          }
          break;
        }
      }
      continue;
    }

    if (ch === '-' && next === '-') {
      // Line comment — skip to newline (but preserve it in the output so line
      // counts stay sensible for later error messages)
      while (i < script.length && script[i] !== '\n') i++;
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i < script.length && !(script[i] === '*' && script[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    if (ch === ';') {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  const trailing = current.trim();
  if (trailing) statements.push(trailing);
  return statements;
}

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
          for (const stmt of splitSqlStatements(content)) {
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
