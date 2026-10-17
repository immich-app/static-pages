import { ForeignKeyAction } from './foreign-key-constraint.decorator.js';
import { ColumnBaseOptions } from './column.decorator.js';
export type ForeignKeyColumnOptions = ColumnBaseOptions & {
    onUpdate?: ForeignKeyAction;
    onDelete?: ForeignKeyAction;
    constraintName?: string;
};
export declare const ForeignKeyColumn: (target: () => Function, options?: ForeignKeyColumnOptions) => PropertyDecorator;
