import { ColumnOptions } from 'src/decorators/column.decorator';
import { GeneratedColumnStrategy } from 'src/decorators/generated-column.decorator';
import { asOptions } from 'src/helpers';
import { register } from 'src/register';

export type InternalColumnOptions = ColumnOptions & {
  strategy?: GeneratedColumnStrategy;
};

export const InternalColumn = (options: string | InternalColumnOptions = {}): PropertyDecorator => {
  return (object: object, propertyName: string | symbol) =>
    void register({ type: 'column', item: { object, propertyName, options: asOptions(options) } });
};
