import { ActionType, ConstraintType, Processor } from 'src/types';

export const processForeignKeyConstraints: Processor = (ctx, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'foreignKeyConstraint')) {
    const table = ctx.getTableByObject(object);
    if (!table) {
      return ctx.onMissingTable('@ForeignKeyConstraint', { name: 'referenceTable' });
    }

    const referenceTable = ctx.getTableByObject(options.referenceTable());
    if (!referenceTable) {
      const referenceTableName = options.referenceTable()?.name;
      return ctx.onMissingTable('@ForeignKeyConstraint.referenceTable', referenceTableName ?? '');
    }

    for (const columnName of options.columns) {
      if (!table.columns.some(({ name }) => name === columnName)) {
        const metadata = ctx.getTableMetadata(table);
        return ctx.onMissingColumn('@ForeignKeyConstraint.columns', `${metadata.object.name}.${columnName}`);
      }
    }

    for (const columnName of options.referenceColumns || []) {
      if (!referenceTable.columns.some(({ name }) => name === columnName)) {
        const metadata = ctx.getTableMetadata(referenceTable);
        return ctx.onMissingColumn('@ForeignKeyConstraint.referenceColumns', `${metadata.object.name}.${columnName}`);
      }
    }

    const referenceTableName = referenceTable.name;
    const referenceColumnNames =
      options.referenceColumns || referenceTable.columns.filter(({ primary }) => primary).map(({ name }) => name);

    const name =
      options.name ||
      ctx.getNameFor({
        type: 'foreignKey',
        tableName: table.name,
        columnNames: options.columns,
        referenceTableName,
        referenceColumnNames,
      });

    table.constraints.push({
      type: ConstraintType.FOREIGN_KEY,
      name,
      tableName: table.name,
      columnNames: options.columns,
      referenceTableName,
      referenceColumnNames,
      onUpdate: options.onUpdate as ActionType,
      onDelete: options.onDelete as ActionType,
      synchronize: options.synchronize ?? true,
    });

    if (options.index === false) {
      continue;
    }

    if (options.index || options.indexName || ctx.options.createForeignKeyIndexes) {
      const indexName =
        options.indexName ||
        ctx.getNameFor({
          type: 'index',
          tableName: table.name,
          columnNames: options.columns,
        });
      table.indexes.push({
        name: indexName,
        tableName: table.name,
        columnNames: options.columns,
        unique: false,
        synchronize: options.synchronize ?? true,
      });
    }
  }
};
