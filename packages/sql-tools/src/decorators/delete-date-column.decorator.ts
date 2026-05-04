import { Column, ColumnOptions } from 'src/decorators/column.decorator';

export const DeleteDateColumn = (options: ColumnOptions = {}): PropertyDecorator => {
  return Column({
    type: 'timestamp with time zone',
    nullable: true,
    ...options,
  });
};
