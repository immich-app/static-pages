import { schemaFromCode } from 'src/schema-from-code';
import { importFixture, getDirectoryFiles } from 'test/utils';
import { describe, expect, it } from 'vitest';

const fixtures = getDirectoryFiles('test/fixtures');
const errorFixtures = getDirectoryFiles('test/fixtures/errors');

describe(schemaFromCode.name, () => {
  it('should work', () => {
    expect(schemaFromCode({ reset: true })).toEqual({
      databaseName: 'postgres',
      schemaName: 'public',
      functions: [],
      enums: [],
      extensions: [],
      parameters: [],
      overrides: [],
      tables: [],
      warnings: [],
    });
  });

  describe('test files', () => {
    describe('errors', () => {
      it.each(errorFixtures)('%s', async (name, filepath) => {
        const module = await importFixture(filepath);
        expect(module.description).toBeDefined();
        expect(module.message).toBeDefined();
        expect(() => schemaFromCode({ reset: true }), module.description).toThrow(module.message);
      });
    });

    it.each(fixtures)('%s', async (name, filepath) => {
      const module = await importFixture(filepath);
      expect(module.description).toBeDefined();
      expect(schemaFromCode({ reset: true }), module.description).toMatchSnapshot();
    });
  });
});
