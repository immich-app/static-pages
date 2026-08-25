import { ColumnOptions } from 'src/decorators/column.decorator.js';
import { InternalColumn } from 'src/internal.js';

export type GeneratedColumnStrategy = 'uuid' | 'uuid-v4' | 'uuid-v7' | 'identity';

export type GenerateColumnOptions = Omit<ColumnOptions, 'type'> & {
  strategy?: GeneratedColumnStrategy;
};

export const GeneratedColumn = ({ strategy = 'uuid', ...options }: GenerateColumnOptions): PropertyDecorator => {
  return InternalColumn({ strategy, ...options });
};
