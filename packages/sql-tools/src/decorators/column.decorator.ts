import { InternalColumn } from 'src/internal';
import { ColumnStorage, ColumnType, DatabaseEnum } from 'src/types';

export type ColumnValue = null | boolean | string | number | Array<unknown> | object | Date | (() => string);

export type ColumnBaseOptions = {
  name?: string;
  primary?: boolean;
  type?: ColumnType;
  nullable?: boolean;
  length?: number;
  default?: ColumnValue;
  comment?: string;
  synchronize?: boolean;
  storage?: ColumnStorage;
  identity?: boolean;
  index?: boolean;
  indexName?: string;
  unique?: boolean;
  uniqueConstraintName?: string;
};

export type ColumnOptions = ColumnBaseOptions & {
  enum?: DatabaseEnum;
  array?: boolean;
};

export const Column = (options: string | ColumnOptions = {}): PropertyDecorator => InternalColumn(options);
