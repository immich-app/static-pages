/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { ForeignKeyAction } from 'src//decorators/foreign-key-constraint.decorator.js';
import { ColumnBaseOptions } from 'src/decorators/column.decorator.js';
import { register } from 'src/register.js';

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
