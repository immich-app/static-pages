import { ColumnOptions } from './column.decorator.js';
export type GeneratedColumnStrategy = 'uuid' | 'uuid-v4' | 'uuid-v7' | 'identity';
export type GenerateColumnOptions = Omit<ColumnOptions, 'type'> & {
    strategy?: GeneratedColumnStrategy;
};
export declare const GeneratedColumn: ({ strategy, ...options }: GenerateColumnOptions) => PropertyDecorator;
