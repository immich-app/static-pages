/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { ForeignKeyAction } from 'src//decorators/foreign-key-constraint.decorator';
import { ColumnBaseOptions } from 'src/decorators/column.decorator';
import { register } from 'src/register';

export type ForeignKeyColumnOptions = ColumnBaseOptions & {
  onUpdate?: ForeignKeyAction;
  onDelete?: ForeignKeyAction;
  constraintName?: string;
};

export const ForeignKeyColumn = (target: () => Function, options?: ForeignKeyColumnOptions): PropertyDecorator => {
  return (object: object, propertyName: string | symbol) => {
    register({ type: 'foreignKeyColumn', item: { object, propertyName, options: options ?? {}, target } });
  };
};
