import { compareConstraints } from 'src/comparers/constraint.comparer';
import { ConstraintType, DatabaseConstraint, Reason } from 'src/types';
import { describe, expect, it } from 'vitest';

const testConstraint: DatabaseConstraint = {
  type: ConstraintType.PRIMARY_KEY,
  name: 'test',
  tableName: 'table1',
  columnNames: ['column1'],
  synchronize: true,
};

describe('compareConstraints', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareConstraints().onExtra(testConstraint)).toEqual([
        {
          type: 'ConstraintDrop',
          object: testConstraint,
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareConstraints().onMissing(testConstraint)).toEqual([
        {
          type: 'ConstraintAdd',
          object: testConstraint,
          reason: Reason.MissingInTarget,
        },
      ]);
    });
  });

  describe('onCompare', () => {
    it('should work', () => {
      expect(compareConstraints().onCompare(testConstraint, testConstraint)).toEqual([]);
    });

    it('should detect a change in type', () => {
      const source: DatabaseConstraint = { ...testConstraint };
      const target: DatabaseConstraint = { ...testConstraint, columnNames: ['column1', 'column2'] };
      const reason = 'Primary key columns are different: (column1 vs column1,column2)';
      expect(compareConstraints().onCompare(source, target)).toEqual([
        { type: 'ConstraintDrop', object: target, reason },
        { type: 'ConstraintAdd', object: source, reason },
      ]);
    });
  });
});
