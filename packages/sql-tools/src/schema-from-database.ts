import { Kysely } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { createPostgres } from 'src/connections/postgres-connection.js';
import { ReaderContext } from 'src/contexts/reader-context.js';
import { readers } from 'src/readers/index.js';
import { DatabaseSchema, PostgresDB, SchemaFromDatabaseOptions } from 'src/types.js';

/**
 * Load schema from a database url
 */
export const schemaFromDatabase = async (options: SchemaFromDatabaseOptions = {}): Promise<DatabaseSchema> => {
  const ctx = new ReaderContext(options);
  const db = new Kysely<PostgresDB>({ dialect: new PostgresJSDialect({ postgres: createPostgres(options) }) });

  try {
    for (const reader of readers) {
      await reader(ctx, db);
    }

    return ctx.build();
  } finally {
    await db.destroy();
  }
};
