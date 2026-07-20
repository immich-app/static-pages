import { Processor } from 'src/types';

export const processDatabases: Processor = (ctx, items) => {
  for (const item of items) {
    if (item.type !== 'database') {
      continue;
    }

    const {
      item: { object, options },
    } = item;
    ctx.databaseName = options.name || ctx.getNameFor({ type: 'database', name: object.name });
  }
};
