/**
 * Kysely dialect adapter for Cloudflare Durable Object SQLite storage.
 *
 * This allows the DO to reuse the same repositories and services as the
 * main API worker — just backed by DO SQLite instead of D1.
 *
 * Modeled after @immich/kysely-adapter-cloudflare (CloudflareD1Dialect).
 */

import {
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  type DatabaseConnection,
  type Dialect,
  type Driver,
  type Kysely,
  type QueryResult,
  type CompiledQuery,
} from 'kysely';

export interface CloudflareDODialectConfig {
  storage: SqlStorage;
}

export class CloudflareDODialect implements Dialect {
  constructor(private config: CloudflareDODialectConfig) {}

  createAdapter() {
    return new SqliteAdapter();
  }

  createDriver(): Driver {
    return new CloudflareDODriver(this.config);
  }

  createQueryCompiler() {
    return new SqliteQueryCompiler();
  }

  createIntrospector(db: Kysely<unknown>) {
    return new SqliteIntrospector(db);
  }
}

class CloudflareDODriver implements Driver {
  private connection: CloudflareDOConnection;

  constructor(private config: CloudflareDODialectConfig) {
    this.connection = new CloudflareDOConnection(config.storage);
  }

  async init(): Promise<void> {}

  async acquireConnection(): Promise<DatabaseConnection> {
    return this.connection;
  }

  // DO SQLite doesn't support explicit transactions — all operations are auto-committed.
  // These are no-ops to satisfy the Kysely driver interface.
  async beginTransaction(): Promise<void> {}
  async commitTransaction(): Promise<void> {}
  async rollbackTransaction(): Promise<void> {}

  async releaseConnection(): Promise<void> {}

  async destroy(): Promise<void> {}
}

class CloudflareDOConnection implements DatabaseConnection {
  constructor(private storage: SqlStorage) {}

  executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const { sql, parameters } = compiledQuery;
    const cursor = this.storage.exec(sql, ...parameters);
    const rows = cursor.toArray() as R[];
    return Promise.resolve({
      rows,
      numAffectedRows: cursor.rowsWritten > 0 ? BigInt(cursor.rowsWritten) : undefined,
      insertId: undefined,
    });
  }

  async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error('DO SQLite driver does not support streaming');
  }
}
