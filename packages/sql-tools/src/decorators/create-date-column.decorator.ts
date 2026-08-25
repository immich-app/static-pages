import { Column, ColumnOptions } from 'src/decorators/column.decorator.js';

export const CreateDateColumn = (options: ColumnOptions = {}): PropertyDecorator => {
  return Column({
    type: 'timestamp with time zone',
    default: () => 'now()',
    ...options,
  });
};
