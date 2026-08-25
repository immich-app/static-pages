import { asColumnList } from 'src/helpers.js';
import { SqlTransformer } from 'src/transformers/types.js';
import { DatabaseIndex } from 'src/types.js';

export const transformIndexes: SqlTransformer = (ctx, { object, type }) => {
  switch (type) {
    case 'IndexCreate': {
      return asIndexCreate(object);
    }

    case 'IndexRename': {
      return `ALTER INDEX "${object.old.name}" RENAME TO "${object.new.name}";`;
    }

    case 'IndexDrop': {
      return `DROP INDEX "${object.name}";`;
    }

    default: {
      return false;
    }
  }
};

export const asIndexCreate = (index: DatabaseIndex): string => {
  let sql = `CREATE`;

  if (index.unique) {
    sql += ' UNIQUE';
  }

  sql += ` INDEX "${index.name}" ON "${index.tableName}"`;

  if (index.columnNames) {
    const columnNames = asColumnList(index.columnNames);
    sql += ` (${columnNames})`;
  }

  if (index.using && index.using !== 'btree') {
    sql += ` USING ${index.using}`;
  }

  if (index.expression) {
    sql += ` (${index.expression})`;
  }

  if (index.with) {
    sql += ` WITH (${index.with})`;
  }

  if (index.where) {
    sql += ` WHERE (${index.where})`;
  }

  return sql + ';';
};
