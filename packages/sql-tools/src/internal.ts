import { ColumnOptions } from 'src/decorators/column.decorator.js';
import { GeneratedColumnStrategy } from 'src/decorators/generated-column.decorator.js';
import { asOptions } from 'src/helpers.js';
import { register } from 'src/register.js';

export type InternalColumnOptions = ColumnOptions & {
  strategy?: GeneratedColumnStrategy;
};

export const InternalColumn = (options: string | InternalColumnOptions = {}): PropertyDecorator => {
  return (object: object, propertyName: string | symbol) =>
    void register({ type: 'column', item: { object, propertyName, options: asOptions(options) } });
};
