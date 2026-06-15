import { ConstraintType, Processor } from 'src/types';

export const processUniqueConstraints: Processor = (ctx, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'uniqueConstraint')) {
    const table = ctx.getTableByObject(object);
    if (!table) {
      return ctx.onMissingTable('@Unique', object);
    }

    const tableName = table.name;
    const columnNames = options.columns;

    table.constraints.push({
      type: ConstraintType.UNIQUE,
      name: options.name || ctx.getNameFor({ type: 'unique', tableName, columnNames }),
      tableName,
      columnNames,
      synchronize: options.synchronize ?? true,
    });
  }

  // column level constraints
  for (const {
    type,
    item: { object, propertyName, options },
  } of items.filter((item) => item.type === 'column' || item.type === 'foreignKeyColumn')) {
    const { table, column } = ctx.getColumnByObjectAndPropertyName(object, propertyName);
    if (!table) {
      return ctx.onMissingTable('@Column', object);
    }

    if (!column) {
      // should be impossible since they are created in `column.processor.ts`
      return ctx.onMissingColumn('@Column', object, propertyName);
    }

    if (type === 'column' && !options.primary && (options.unique || options.uniqueConstraintName)) {
      const uniqueConstraintName =
        options.uniqueConstraintName ||
        ctx.getNameFor({
          type: 'unique',
          tableName: table.name,
          columnNames: [column.name],
        });

      table.constraints.push({
        type: ConstraintType.UNIQUE,
        name: uniqueConstraintName,
        tableName: table.name,
        columnNames: [column.name],
        synchronize: options.synchronize ?? true,
      });
    }
  }
};
