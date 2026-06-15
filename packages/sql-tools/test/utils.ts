import { Kysely } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createPostgres } from 'src/connections/postgres-connection';
import { DatabaseConnectionParams } from 'src/types';

export const getDirectoryFiles = (directory: string) => {
  const fixtures: Array<[string, string]> = [];
  for (const file of readdirSync(directory, { withFileTypes: true })) {
    if (file.isDirectory()) {
      continue;
    }

    fixtures.push([file.name, join(file.parentPath, file.name)]);
  }

  return fixtures;
};

export const importFixture = async (file: string) => {
  return import(file);
};

const templateName = 'template';
const withDatabase = (url: string, name: string) => url.replace(`/${templateName}`, `/${name}`);

export const getKyselyDB = async <T = unknown>(suffix?: string) => {
  const testUrl = process.env.IMMICH_TEST_POSTGRES_URL;
  if (!testUrl) {
    throw new Error('IMMICH_TEST_POSTGRES_URL not set');
  }

  const sql = createPostgres({
    maxConnections: 1,
    connection: { connectionType: 'url', url: withDatabase(testUrl, 'postgres') },
  });

  const randomSuffix = Math.random().toString(36).slice(2, 7);
  const dbName = `immich_${suffix ?? randomSuffix}`;
  await sql.unsafe(`CREATE DATABASE ${dbName} WITH TEMPLATE ${templateName} OWNER postgres;`);

  const connection = { connectionType: 'url', url: withDatabase(testUrl, dbName) } as DatabaseConnectionParams;

  return {
    name: dbName,
    connection,
    kysely: new Kysely<T>({ dialect: new PostgresJSDialect({ postgres: createPostgres({ connection }) }) }),
  };
};
