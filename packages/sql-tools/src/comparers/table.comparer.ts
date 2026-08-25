import { compareColumns } from 'src/comparers/column.comparer.js';
import { compareConstraints } from 'src/comparers/constraint.comparer.js';
import { compareIndexes } from 'src/comparers/index.comparer.js';
import { compareTriggers } from 'src/comparers/trigger.comparer.js';
import { compare } from 'src/helpers.js';
import {
  Comparer,
  ConstraintType,
  DatabaseForeignKeyConstraint,
  DatabaseTable,
  Reason,
  SchemaDiffOptions,
} from 'src/types.js';

const getDeferredForeignKeys = (table: DatabaseTable) =>
  table.constraints.filter(
    (c): c is DatabaseForeignKeyConstraint => c.type === ConstraintType.FOREIGN_KEY && !!c.deferred,
  );

export const compareTables = (options: SchemaDiffOptions): Comparer<DatabaseTable> => ({
  onMissing: (source) =>
    [
      { type: 'TableCreate' as const, object: source },
      ...source.indexes.map((object) => ({ type: 'IndexCreate' as const, object })),
      ...source.triggers.map((object) => ({ type: 'TriggerCreate' as const, object })),
      // deferred FK constraints are not inlined in CREATE TABLE — add them separately
      ...getDeferredForeignKeys(source).map((object) => ({ type: 'ConstraintAdd' as const, object })),
    ].map((item) => ({ ...item, reason: Reason.MissingInTarget })),
  onExtra: (target) =>
    [
      { type: 'TableDrop' as const, object: target },
      ...target.triggers.map((object) => ({ type: 'TriggerDrop' as const, object })),
      // deferred FK constraints must be dropped explicitly before their referenced table can be dropped
      ...getDeferredForeignKeys(target).map((object) => ({
        type: 'ConstraintDrop' as const,
        object,
      })),
    ].map((item) => ({ ...item, reason: Reason.MissingInSource })),
  onCompare: (source, target) => {
    return [
      ...compare(source.columns, target.columns, options.columns, compareColumns()),
      ...compare(source.indexes, target.indexes, options.indexes, compareIndexes()),
      ...compare(source.constraints, target.constraints, options.constraints, compareConstraints()),
      ...compare(source.triggers, target.triggers, options.triggers, compareTriggers()),
    ];
  },
});
