import { Processor } from 'src/types';

export const processExtensions: Processor = (ctx, items) => {
  if (ctx.options.extensions === false) {
    return;
  }

  for (const item of items) {
    if (item.type !== 'extension') {
      continue;
    }

    const {
      item: { options },
    } = item;
    ctx.extensions.push({
      name: options.name,
      synchronize: options.synchronize ?? true,
    });
  }
};
