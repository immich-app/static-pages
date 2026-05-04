import { compareTables } from 'src/comparers/table.comparer';
import { DatabaseTable, Reason } from 'src/types';
import { describe, expect, it } from 'vitest';

const testTable: DatabaseTable = {
  name: 'test',
  columns: [],
  constraints: [],
  indexes: [],
  triggers: [],
  synchronize: true,
};

describe('compareParameters', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareTables({}).onExtra(testTable)).toEqual([
        {
          type: 'TableDrop',
          object: testTable,
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareTables({}).onMissing(testTable)).toEqual([
        {
          type: 'TableCreate',
          object: testTable,
          reason: Reason.MissingInTarget,
        },
      ]);
    });
  });

  describe('onCompare', () => {
    it('should work', () => {
      expect(compareTables({}).onCompare(testTable, testTable)).toEqual([]);
    });
  });
});
