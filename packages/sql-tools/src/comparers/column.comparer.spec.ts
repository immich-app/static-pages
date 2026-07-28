import { compareColumns } from 'src/comparers/column.comparer';
import { DatabaseColumn, Reason } from 'src/types';
import { describe, expect, it } from 'vitest';

const testColumn: DatabaseColumn = {
  name: 'test',
  tableName: 'table1',
  primary: false,
  nullable: false,
  isArray: false,
  type: 'character varying',
  synchronize: true,
};

describe('compareColumns', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareColumns().onExtra(testColumn)).toEqual([
        {
          type: 'ColumnDrop',
          object: testColumn,
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareColumns().onMissing(testColumn)).toEqual([
        {
          type: 'ColumnAdd',
          object: testColumn,
          reason: Reason.MissingInTarget,
        },
      ]);
    });
  });

  describe('onCompare', () => {
    it('should work', () => {
      expect(compareColumns().onCompare(testColumn, testColumn)).toEqual([]);
    });

    it('should detect a change in type', () => {
      const source: DatabaseColumn = { ...testColumn };
      const target: DatabaseColumn = { ...testColumn, type: 'text' };
      const reason = 'column type is different (character varying vs text)';
      expect(compareColumns().onCompare(source, target)).toEqual([
        { type: 'ColumnDrop', object: target, reason },
        { type: 'ColumnAdd', object: source, reason },
      ]);
    });

    it('should detect a change in default', () => {
      const source: DatabaseColumn = { ...testColumn, nullable: true };
      const target: DatabaseColumn = { ...testColumn, nullable: true, default: "''" };
      const reason = `default is different (null vs '')`;
      expect(compareColumns().onCompare(source, target)).toEqual([
        {
          type: 'ColumnAlter',
          object: {
            old: target,
            new: source,
            changes: {
              default: 'NULL',
            },
          },
          reason,
        },
      ]);
    });

    it('should detect a comment change', () => {
      const source: DatabaseColumn = { ...testColumn, comment: 'new comment' };
      const target: DatabaseColumn = { ...testColumn, comment: 'old comment' };
      const reason = 'comment is different (new comment vs old comment)';
      expect(compareColumns().onCompare(source, target)).toEqual([
        {
          type: 'ColumnAlter',
          object: {
            old: target,
            new: source,
            changes: {
              comment: 'new comment',
            },
          },
          reason,
        },
      ]);
    });
  });
});
