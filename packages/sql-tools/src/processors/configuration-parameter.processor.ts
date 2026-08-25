import { fromColumnValue } from 'src/helpers.js';
import { Processor } from 'src/types.js';

export const processConfigurationParameters: Processor = (ctx, items) => {
  for (const item of items) {
    if (item.type !== 'configurationParameter') {
      continue;
    }

    const {
      item: { options },
    } = item;
    ctx.parameters.push({
      databaseName: ctx.databaseName,
      name: options.name,
      value: fromColumnValue(options.value),
      scope: options.scope,
      synchronize: options.synchronize ?? true,
    });
  }
};
