import { fromColumnValue } from 'src/helpers';
import { Processor } from 'src/types';

export const processConfigurationParameters: Processor = (ctx, items) => {
  for (const {
    item: { options },
  } of items.filter((item) => item.type === 'configurationParameter')) {
    ctx.parameters.push({
      databaseName: ctx.databaseName,
      name: options.name,
      value: fromColumnValue(options.value),
      scope: options.scope,
      synchronize: options.synchronize ?? true,
    });
  }
};
