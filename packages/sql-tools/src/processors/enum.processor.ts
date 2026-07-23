import { Processor } from 'src/types';

export const processEnums: Processor = (ctx, items) => {
  for (const result of items) {
    if (result.type !== 'enum') {
      continue;
    }
    // TODO log warnings if enum name is not unique
    ctx.enums.push(result.item);
  }
};
