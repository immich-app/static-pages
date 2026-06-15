import { ActionType, ConstraintType, Processor } from 'src/types';

export const processForeignKeyColumns: Processor = (ctx, items) => {
  for (const {
    item: { object, propertyName, options, target },
  } of items.filter((item) => item.type === 'foreignKeyColumn')) {
    const { table, column } = ctx.getColumnByObjectAndPropertyName(object, propertyName);
    if (!table) {
      return ctx.onMissingTable('@ForeignKeyColumn', object);
    }

    if (!column) {
      // should be impossible since they are pre-created in `column.processor.ts`
      return ctx.onMissingColumn('@ForeignKeyColumn', object, propertyName);
    }

    const referenceTable = ctx.getTableByObject(target());
    if (!referenceTable) {
      return ctx.onMissingTable('@ForeignKeyColumn', object, propertyName);
    }

    const columnNames = [column.name];
    const referenceColumns = referenceTable.columns.filter(({ primary }) => primary);

    // infer FK column type from reference table
    if (referenceColumns.length === 1) {
      column.type = referenceColumns[0].type;
    }

    const referenceTableName = referenceTable.name;
    const referenceColumnNames = referenceColumns.map(({ name }) => name);
    const name =
      options.constraintName ||
      ctx.getNameFor({
        type: 'foreignKey',
        tableName: table.name,
        columnNames,
        referenceTableName,
        referenceColumnNames,
      });

    table.constraints.push({
      name,
      tableName: table.name,
      columnNames,
      type: ConstraintType.FOREIGN_KEY,
      referenceTableName,
      referenceColumnNames,
      onUpdate: options.onUpdate as ActionType,
      onDelete: options.onDelete as ActionType,
      synchronize: options.synchronize ?? true,
    });

    if (options.unique || options.uniqueConstraintName) {
      table.constraints.push({
        name: options.uniqueConstraintName || ctx.getNameFor({ type: 'unique', tableName: table.name, columnNames }),
        tableName: table.name,
        columnNames,
        type: ConstraintType.UNIQUE,
        synchronize: options.synchronize ?? true,
      });
    }
  }
};
