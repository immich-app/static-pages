import { ColumnOptions } from './decorators/column.decorator.js';
import { GeneratedColumnStrategy } from './decorators/generated-column.decorator.js';
export type InternalColumnOptions = ColumnOptions & {
    strategy?: GeneratedColumnStrategy;
};
export declare const InternalColumn: (options?: string | InternalColumnOptions) => PropertyDecorator;
