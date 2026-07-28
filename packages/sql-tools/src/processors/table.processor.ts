import { Processor } from 'src/types';

export const processTables: Processor = (ctx, items) => {
  for (const item of items) {
    if (item.type !== 'table') {
      continue;
    }

    const {
      item: { options, object },
    } = item;
    const test = ctx.getTableByObject(object);
    if (test) {
      throw new Error(
        `Table ${test.name} has already been registered. Does ${object.name} have two @Table() decorators?`,
      );
    }

    ctx.addTable(
      {
        name: options.name || ctx.getNameFor({ type: 'table', name: object.name }),
        columns: [],
        constraints: [],
        indexes: [],
        triggers: [],
        synchronize: options.synchronize ?? true,
      },
      options,
      object,
    );
  }
};
