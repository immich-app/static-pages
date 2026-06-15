import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';
import {
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  type CompiledQuery,
  type DatabaseConnection,
  type DatabaseIntrospector,
  type Dialect,
  type Driver,
  type QueryCompiler,
  type QueryResult,
} from 'kysely';

export type CloudflareD1DialectConfig = {
  database: D1Database;
};

export class CloudflareD1Dialect implements Dialect {
  constructor(private config: CloudflareD1DialectConfig) {}

  createAdapter() {
    return new SqliteAdapter();
  }

  createDriver(): Driver {
    return new CloudflareD1Driver(this.config);
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db);
  }
}

export class CloudflareD1Driver implements Driver {
  constructor(private config: CloudflareD1DialectConfig) {}

  async init(): Promise<void> {}

  async acquireConnection(): Promise<DatabaseConnection> {
    return new CloudflareD1Connection(this.config);
  }

  async beginTransaction(connection: CloudflareD1Connection): Promise<void> {
    await connection.beginTransaction();
  }

  async commitTransaction(connection: CloudflareD1Connection): Promise<void> {
    await connection.commitTransaction();
  }

  async rollbackTransaction(connection: CloudflareD1Connection): Promise<void> {
    await connection.rollbackTransaction();
  }

  async releaseConnection(): Promise<void> {}

  async destroy(): Promise<void> {}
}

export class CloudflareD1Connection implements DatabaseConnection {
  private batch?: D1PreparedStatement[];

  constructor(private config: CloudflareD1DialectConfig) {}

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const query = this.config.database.prepare(compiledQuery.sql).bind(...compiledQuery.parameters);

    if (this.batch) {
      this.batch.push(query);
      return { rows: [], numAffectedRows: 0n };
    }

    const results = await query.all();
    if (results.error) {
      throw new Error(results.error);
    }

    const numAffectedRows = results.meta.changes > 0 ? BigInt(results.meta.changes) : undefined;

    return {
      insertId:
        results.meta.last_row_id === undefined || results.meta.last_row_id === null
          ? undefined
          : BigInt(results.meta.last_row_id),
      rows: (results?.results as O[]) || [],
      numAffectedRows,
    };
  }

  async beginTransaction() {
    if (this.batch) {
      throw new Error('Transaction already in progress');
    }

    this.batch = [];
  }

  async commitTransaction() {
    if (!this.batch) {
      throw new Error('No transaction to commit');
    }

    if (this.batch.length > 0) {
      const results = await this.config.database.batch(this.batch);
      for (const result of results) {
        if (result.error) {
          throw new Error(`Unable to commit batch: ${result.error}`);
        }
      }
    }

    this.batch = undefined;
  }

  async rollbackTransaction() {
    if (!this.batch) {
      throw new Error('No transaction to rollback');
    }

    this.batch = undefined;
  }

  // eslint-disable-next-line require-yield
  async *streamQuery<O>(): AsyncIterableIterator<QueryResult<O>> {
    throw new Error('D1 Driver does not support streaming');
  }
}
