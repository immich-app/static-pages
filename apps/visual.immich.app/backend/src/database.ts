import { CloudflareD1Dialect } from '@immich/kysely-adapter-cloudflare';
import { Kysely } from 'kysely';
import type { DB } from './schema/tables';

export const createDatabase = (database: D1Database) =>
  new Kysely<DB>({ dialect: new CloudflareD1Dialect({ database }) });
