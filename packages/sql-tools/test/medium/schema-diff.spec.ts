import { schemaFromCode } from 'src/schema-from-code';
import { TestDatabase } from 'test/medium/test-database';
import { getDirectoryFiles, importFixture } from 'test/utils';
import { afterEach, beforeEach, describe, expect, it, onTestFailed } from 'vitest';

const DEBUG_NAME = '';
const fixtures = getDirectoryFiles('test/fixtures').filter(([name]) => !DEBUG_NAME || name === DEBUG_NAME);

describe('fixtures', () => {
  let db: TestDatabase;

  beforeEach(async () => {
    schemaFromCode({ reset: true });
    db = await TestDatabase.create();
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('should work', () => {
    expect(1).toEqual(1);
  });

  it.each(fixtures)('%s', async (name, filename) => {
    const { options } = await importFixture(filename);
    const diff1 = await db.diff(options);

    onTestFailed(() => {
      const up = db.debug(diff1.up.asSql({ outputTarget: 'sql' }).join('\n'));
      const down = db.debug(diff1.down.asSql({ outputTarget: 'sql' }).join('\n'));

      // (filename, diff1.up, diff1.down)
      console.log(
        `DEBUG: ${filename}

# up sql
${up}

# down sql
${down}
`,
      );
    });

    // apply the migration
    await expect(db.query(diff1.up)).resolves.toMatchSnapshot();

    // verify changes
    const diff2 = await db.diff(options);
    expect(diff2.up.items).toEqual([]);
    expect(diff2.down.items).toEqual([]);

    // apply the down migration
    await expect(db.query(diff1.down)).resolves.toMatchSnapshot();

    // verify changes
    const diff3 = await db.diff(options);
    expect(diff3.up.items).toEqual(diff1.up.items);
    expect(diff3.down.items).toEqual(diff1.down.items);
  });
});
