import { Processor } from 'src/types';

export const processEnums: Processor = (ctx, items) => {
  for (const result of items.filter((item) => item.type === 'enum')) {
    // TODO log warnings if enum name is not unique
    ctx.enums.push(result.item);
  }
};
