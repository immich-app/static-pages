import { D1Database } from '@cloudflare/workers-types';
import { Kysely, sql } from 'kysely';
import { CloudflareD1Dialect } from 'src/d1';
import { describe, expect, it, vi } from 'vitest';

type Schema = {
  user: {
    name: string;
  };
};

const createD1Mock = () => {
  const all = vi.fn().mockImplementation(() => {
    return {
      success: true,
      meta: {},
    };
  });

  const prepare = vi.fn().mockImplementation((query) => ({
    bind: (params: unknown) => ({ query, params, all }),
  }));
  const batch = vi.fn().mockResolvedValue([]);
  const exec = vi.fn();
  const withSession = vi.fn();
  const dump = vi.fn();

  return { mocks: { all }, prepare, batch, exec, withSession, dump };
};

const createKysely = (database: D1Database) => {
  return new Kysely<Schema>({ dialect: new CloudflareD1Dialect({ database }) });
};

describe('d1', () => {
  it('should work', () => {
    expect(CloudflareD1Dialect).toBeDefined();
  });

  describe(CloudflareD1Dialect.name, () => {
    it('should execute a query', async () => {
      const d1 = createD1Mock();
      const db = createKysely(d1);

      d1.mocks.all.mockResolvedValue({
        success: true,
        meta: { changes: 0 },
        results: [{ name: 'Alice' }],
      });

      await expect(sql`SELECT * FROM user`.execute(db)).resolves.toEqual({ rows: [{ name: 'Alice' }] });

      expect(d1.batch).not.toHaveBeenCalled();
    });

    it('should execute a query in a transaction', async () => {
      const d1 = createD1Mock();
      const db = createKysely(d1);

      d1.mocks.all.mockResolvedValue({
        success: true,
        meta: { changes: 1 },
        results: [{ name: 'Alice' }],
      });

      await db.transaction().execute(async (tx) => {
        await tx.insertInto('user').values({ name: 'Alice' }).execute();
      });

      expect(d1.batch).toHaveBeenCalledWith([
        expect.objectContaining({ params: 'Alice', query: 'insert into "user" ("name") values (?)' }),
      ]);
    });
  });
});
