import { Column, ColumnOptions } from 'src/decorators/column.decorator.js';

export const UpdateDateColumn = (options: ColumnOptions = {}): PropertyDecorator => {
  return Column({
    type: 'timestamp with time zone',
    default: () => 'now()',
    ...options,
  });
};
