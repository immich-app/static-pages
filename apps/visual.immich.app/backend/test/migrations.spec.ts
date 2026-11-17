import { applyD1Migrations, reset } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => reset());

describe('migrations', () => {
  it('creates the user and session tables on a fresh database', async () => {
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

    const query = `select name from sqlite_master where type = 'table' order by name`;
    const { results } = await env.DB.prepare(query).all<{ name: string }>();
    expect(results.map(({ name }) => name)).toEqual(expect.arrayContaining(['session', 'user']));
  });
});
