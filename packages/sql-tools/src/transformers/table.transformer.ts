import { asColumnComment, getColumnModifiers, getColumnType } from 'src/helpers';
import { asColumnAlter } from 'src/transformers/column.transformer';
import { asConstraintBody } from 'src/transformers/constraint.transformer';
import { SqlTransformer } from 'src/transformers/types';
import { ConstraintType } from 'src/types';

export const transformTables: SqlTransformer = (ctx, { object, type }) => {
  switch (type) {
    case 'TableCreate': {
      const tableName = object.name;
      const items: string[] = [];
      for (const column of object.columns) {
        items.push(`"${column.name}" ${getColumnType(column)}${getColumnModifiers(column)}`);
      }

      for (const constraint of object.constraints) {
        if (constraint.type === ConstraintType.FOREIGN_KEY && constraint.deferred) {
          continue;
        }

        items.push(asConstraintBody(constraint));
      }

      const sql = [`CREATE TABLE "${tableName}" (\n  ${items.join(',\n  ')}\n);`];

      for (const column of object.columns) {
        if (column.comment) {
          sql.push(asColumnComment(tableName, column.name, column.comment));
        }

        if (column.storage) {
          sql.push(...asColumnAlter(tableName, column.name, { storage: column.storage }));
        }
      }

      return sql;
    }

    case 'TableDrop': {
      return `DROP TABLE "${object.name}";`;
    }

    default: {
      return false;
    }
  }
};
