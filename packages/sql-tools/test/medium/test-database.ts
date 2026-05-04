import { sql } from 'kysely';
import { schemaDiff } from 'src/schema-diff';
import { schemaFromCode } from 'src/schema-from-code';
import { schemaFromDatabase } from 'src/schema-from-database';
import {
  DatabaseClient,
  DatabaseConnectionParams,
  PostgresDB,
  SchemaDiffResult,
  SchemaFromCodeOptions,
} from 'src/types';
import { getKyselyDB } from 'test/utils';
import { assert, expect } from 'vitest';

export class TestDatabase {
  private constructor(
    public readonly name: string,
    public kysely: DatabaseClient,
    public connection: DatabaseConnectionParams,
  ) {}

  static async create() {
    const { name, kysely, connection } = await getKyselyDB<PostgresDB>();
    return new TestDatabase(name, kysely, connection);
  }

  async destroy() {
    await this.kysely.destroy();
  }

  async diff(options: SchemaFromCodeOptions) {
    const source = schemaFromCode({
      ...options,
      outputTarget: 'sql',
      overrides: true,
      uuidFunction: 'uuid_generate_v4()',
    });
    expect(source.warnings).toEqual([]);

    const target = await this.schemaFromDatabase();

    const up = schemaDiff(source, target, {
      tables: { ignoreExtra: true },
      functions: { ignoreExtra: false },
      parameters: { ignoreExtra: true },
      extensions: { ignoreExtra: true },
    });

    const down = schemaDiff(target, source, {
      tables: { ignoreExtra: false, ignoreMissing: true },
      functions: { ignoreExtra: false },
      extensions: { ignoreMissing: true },
      parameters: { ignoreMissing: true },
    });

    return { up, down };
  }

  async query({ asSql }: SchemaDiffResult) {
    const query = asSql({ outputTarget: 'sql' }).join('\n');

    try {
      const results = await sql.raw(query).execute(this.kysely);
      expect(results).toBeDefined();
    } catch (error) {
      assert.fail(`${this.debug('Unable to run SQL: \n' + query)}\nError: ${error}`);
    }

    return query;
  }

  debug(message: string) {
    return '\n> ' + message.split('\n').join('\n> ');
  }

  schemaFromDatabase() {
    return schemaFromDatabase({ connection: this.connection });
  }
}
