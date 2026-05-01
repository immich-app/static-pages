import { FileMigrationProvider, Kysely, Migrator as KyselyMigrator } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import {
  DatabaseConnectionParams,
  UuidFunctionFactory,
  createPostgres,
  schemaDiff,
  schemaFromCode,
  schemaFromDatabase,
} from 'src';

type MigrationProps = {
  up: string[];
  down: string[];
};

const defaultUuidFactory = ({ db, major }: { db: string; major: string }): UuidFunctionFactory => {
  switch (db) {
    case 'PostgreSQL': {
      switch (major) {
        case '18': {
          return (version) => (version === 4 ? 'uuidv4()' : 'uuidv7()');
        }
        default: {
          return () => 'uuid_generate_v4()';
        }
      }
    }

    default: {
      throw new Error(`Unsupported database: ${db}`);
    }
  }
};

export class Migrator {
  #db: Kysely<unknown>;
  #migrator: KyselyMigrator;
  #connectionParams: DatabaseConnectionParams;
  #migrationsFolder: string;
  #uuidFactory: typeof defaultUuidFactory;

  constructor(options: {
    connectionParams: DatabaseConnectionParams;
    allowUnorderedMigrations: boolean;
    migrationFolder: string;
    uuidFactory?: typeof defaultUuidFactory;
  }) {
    const { connectionParams, allowUnorderedMigrations, migrationFolder, uuidFactory } = options;
    this.#connectionParams = connectionParams;
    this.#migrationsFolder = migrationFolder;
    this.#uuidFactory = uuidFactory ?? defaultUuidFactory;
    this.#db = this.#getDatabaseClient();
    this.#migrator = this.#getMigrator(allowUnorderedMigrations);
  }

  #getDatabaseClient() {
    return new Kysely<unknown>({
      dialect: new PostgresJSDialect({ postgres: createPostgres({ connection: this.#connectionParams }) }),
    });
  }

  #getMigrator(allowUnorderedMigrations: boolean) {
    return new KyselyMigrator({
      db: this.#db,
      migrationLockTableName: 'kysely_migrations_lock',
      allowUnorderedMigrations,
      migrationTableName: 'kysely_migrations',
      provider: new FileMigrationProvider({
        fs: { readdir },
        path: { join },
        migrationFolder: join(this.#migrationsFolder),
      }),
    });
  }

  getDatabase() {
    return this.#db;
  }

  async runMigrations(): Promise<void> {
    const { error, results } = await this.#migrator.migrateToLatest();

    for (const result of results ?? []) {
      if (result.status === 'Success') {
        console.log(`Migration "${result.migrationName}" succeeded`);
      }

      if (result.status === 'Error') {
        console.warn(`Migration "${result.migrationName}" failed`);
      }
    }

    if (error) {
      console.error(`Migrations failed: ${error}`);
      throw error;
    }

    console.log('Finished running migrations');
  }

  async #revertLastMigration(): Promise<string | undefined> {
    console.debug('Reverting last migration');

    const { error, results } = await this.#migrator.migrateDown();

    for (const result of results ?? []) {
      if (result.status === 'Success') {
        console.log(`Reverted migration "${result.migrationName}"`);
      }

      if (result.status === 'Error') {
        console.warn(`Failed to revert migration "${result.migrationName}"`);
      }
    }

    if (error) {
      console.error(`Failed to revert migrations: ${error}`);
      throw error;
    }

    const reverted = results?.find((result) => result.direction === 'Down' && result.status === 'Success');
    if (!reverted) {
      console.debug('No migrations to revert');
      return undefined;
    }

    console.debug('Finished reverting migration');
    return reverted.migrationName;
  }

  async revert(migrationsDistFolder: string) {
    const migrationName = await this.#revertLastMigration();
    if (!migrationName) {
      console.log('No migrations to revert');
      return;
    }

    this.#markMigrationAsReverted(migrationName, migrationsDistFolder);
  }

  async generate({ dist, targetPath, withComments }: { dist: string; targetPath: string; withComments: boolean }) {
    const paths: string[] = [];
    for (const filename of await readdir(dist, { recursive: true })) {
      if (extname(filename) !== '.js') {
        continue;
      }

      paths.push(join(dist, filename));
    }

    await Promise.all(paths.map((path) => import(path)));

    const { up, down } = await this.#compare();
    if (up.items.length === 0) {
      console.log('No changes detected');
      return;
    }
    this.create(targetPath, up.asSql({ comments: withComments }), down.asSql({ comments: withComments }));
  }

  create(path: string, up: string[], down: string[]) {
    const timestamp = Date.now();
    const name = basename(path, extname(path));
    const filename = `${timestamp}-${name}.ts`;
    const folder = dirname(path);
    const fullPath = join(folder, filename);
    mkdirSync(folder, { recursive: true });
    writeFileSync(fullPath, this.#asMigration({ up, down }));
    console.log(`Wrote ${fullPath}`);
  }

  async #compare() {
    const { version } = await this.#db
      .selectNoFrom(({ fn }) => fn('version').$castTo<string>().as('version'))
      .executeTakeFirstOrThrow();
    const { db, major } = /^(?<db>\w+) (?<major>\d+)\.(?<minor>\d+)(\.(?<patch>\d+))?.*$/.exec(version)?.groups ?? {};

    const source = schemaFromCode({
      overrides: true,
      namingStrategy: 'default',
      uuidFunction: this.#uuidFactory({ db, major }),
    });
    const target = await schemaFromDatabase({ connection: this.#connectionParams });

    console.log(source.warnings.join('\n'));

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

  #asMigration({ up, down }: MigrationProps) {
    const upSql = up.map((sql) => `  await sql\`${sql}\`.execute(db);`).join('\n');
    const downSql = down.map((sql) => `  await sql\`${sql}\`.execute(db);`).join('\n');

    return `import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
${upSql}
}

export async function down(db: Kysely<any>): Promise<void> {
${downSql}
}
`;
  }

  #markMigrationAsReverted(migrationName: string, migrationsDistFolder: string) {
    const sourcePath = join(this.#migrationsFolder, `${migrationName}.ts`);
    const revertedFolder = join(this.#migrationsFolder, 'reverted');
    const revertedPath = join(revertedFolder, `${migrationName}.ts`);

    if (existsSync(revertedPath)) {
      console.log(`Migration ${migrationName} is already marked as reverted`);
    } else if (existsSync(sourcePath)) {
      mkdirSync(revertedFolder, { recursive: true });
      renameSync(sourcePath, revertedPath);
      console.log(`Moved ${sourcePath} to ${revertedPath}`);
    } else {
      console.warn(`Source migration file not found for ${migrationName}`);
    }

    const distBase = join(migrationsDistFolder, migrationName);
    for (const extension of ['.js', '.js.map', '.d.ts']) {
      const filePath = `${distBase}${extension}`;
      if (existsSync(filePath)) {
        rmSync(filePath, { force: true });
        console.log(`Removed ${filePath}`);
      }
    }
  }

  destroy() {
    return this.#db.destroy();
  }
}
