import { asColumnComment, getColumnModifiers, getColumnType } from 'src/helpers';
import { SqlTransformer } from 'src/transformers/types';
import { ColumnChanges, DatabaseColumn } from 'src/types';

export const transformColumns: SqlTransformer = (ctx, { type, object }) => {
  switch (type) {
    case 'ColumnAdd': {
      return asColumnAdd(object);
    }

    case 'ColumnAlter': {
      return asColumnAlter(object.new.tableName, object.new.name, object.changes);
    }

    case 'ColumnRename': {
      return `ALTER TABLE "${object.new.tableName}" RENAME COLUMN "${object.old.name}" TO "${object.new.name}";`;
    }

    case 'ColumnDrop': {
      return `ALTER TABLE "${object.tableName}" DROP COLUMN "${object.name}";`;
    }

    default: {
      return false;
    }
  }
};

const asColumnAdd = (column: DatabaseColumn): string => {
  return (
    `ALTER TABLE "${column.tableName}" ADD "${column.name}" ${getColumnType(column)}` + getColumnModifiers(column) + ';'
  );
};

export const asColumnAlter = (tableName: string, columnName: string, changes: ColumnChanges): string[] => {
  const base = `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}"`;
  const items: string[] = [];
  if (changes.nullable !== undefined) {
    items.push(changes.nullable ? `${base} DROP NOT NULL;` : `${base} SET NOT NULL;`);
  }

  if (changes.default !== undefined) {
    items.push(`${base} SET DEFAULT ${changes.default};`);
  }

  if (changes.storage !== undefined) {
    items.push(`${base} SET STORAGE ${changes.storage.toUpperCase()};`);
  }

  if (changes.comment !== undefined) {
    items.push(asColumnComment(tableName, columnName, changes.comment));
  }

  return items;
};
