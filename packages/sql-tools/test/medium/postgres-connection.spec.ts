import { sql } from 'kysely';
import { TestDatabase } from 'test/medium/test-database.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('postgres connection', () => {
  let db: TestDatabase;

  beforeEach(async () => {
    db = await TestDatabase.create();
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('should write and read a timestamp with a year below 100', async () => {
    const createdAt = new Date('0015-09-15T00:00:00Z');
    await sql`CREATE TABLE "item" ("createdAt" timestamptz NOT NULL)`.execute(db.kysely);
    await sql`INSERT INTO "item" ("createdAt") VALUES (${createdAt})`.execute(db.kysely);

    const { rows } = await sql<{ createdAt: Date }>`SELECT "createdAt" FROM "item"`.execute(db.kysely);
    expect(rows).toEqual([{ createdAt }]);
  });
});
