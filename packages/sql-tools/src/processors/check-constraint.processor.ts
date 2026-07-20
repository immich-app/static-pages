import { ConstraintType, Processor } from 'src/types';

export const processCheckConstraints: Processor = (ctx, items) => {
  for (const item of items) {
    if (item.type !== 'checkConstraint') {
      continue;
    }

    const {
      item: { object, options },
    } = item;
    const table = ctx.getTableByObject(object);
    if (!table) {
      return ctx.onMissingTable('@Check', object);
    }

    const tableName = table.name;

    table.constraints.push({
      type: ConstraintType.CHECK,
      name: options.name || ctx.getNameFor({ type: 'check', tableName, expression: options.expression }),
      tableName,
      expression: options.expression,
      synchronize: options.synchronize ?? true,
    });
  }
};
