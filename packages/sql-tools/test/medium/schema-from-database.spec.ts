import { sql } from 'kysely';
import { readFile } from 'node:fs/promises';
import { TestDatabase } from 'test/medium/test-database';
import { getDirectoryFiles } from 'test/utils';
import { afterEach, beforeEach, describe, expect, it, onTestFailed } from 'vitest';

const queries = getDirectoryFiles('test/medium/queries');

describe('schemaFromDatabase', () => {
  let db: TestDatabase;

  beforeEach(async () => {
    db = await TestDatabase.create();
  });

  afterEach(async () => {
    await db.destroy();
  });

  it.each(queries)('%s', async (name, filename) => {
    const bytes = await readFile(filename);
    const query = bytes.toString();

    onTestFailed(() => console.log(`DEBUG: ${filename}\n${db.debug(query)}`));

    await sql.raw(query).execute(db.kysely);
    const schema = await db.schemaFromDatabase();
    expect({ ...schema, databaseName: 'postgres', extensions: [] }).toMatchSnapshot();
  });
});
