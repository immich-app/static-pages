import { BaseContext } from './contexts/base-context.js';
import { ColumnValue } from './decorators/column.decorator.js';
import { Comparer, DatabaseColumn, DatabaseOverride, IgnoreOptions, OutputTarget, SchemaDiff, SchemaItem } from './types.js';
export declare const asOptions: <T extends {
    name?: string;
}>(options: string | T) => T;
export declare const sha1: (value: string) => string;
export declare const fromColumnValue: (columnValue?: ColumnValue) => string | undefined | null;
export declare const setIsEqual: (source: Set<unknown>, target: Set<unknown>) => boolean;
export declare const haveEqualColumns: (sourceColumns?: string[], targetColumns?: string[]) => boolean;
export declare const haveEqualOverrides: <T extends {
    override?: DatabaseOverride;
}>(source: T, target: T) => boolean;
export declare const compare: <T extends {
    name: string;
    synchronize: boolean;
}>(sources: T[], targets: T[], options: IgnoreOptions | undefined, comparer: Comparer<T>) => SchemaDiff[];
export declare const isDefaultEqual: (source: DatabaseColumn, target: DatabaseColumn) => boolean;
export declare const getColumnType: (column: DatabaseColumn) => string;
export declare const getColumnModifiers: (column: DatabaseColumn) => string;
export declare const asColumnComment: (tableName: string, columnName: string, comment: string) => string;
export declare const asColumnList: (columns: string[]) => string;
export declare const asJsonString: (input: unknown, options: {
    outputTarget: OutputTarget;
}) => string;
export declare const asRenameKey: (values: Array<string | boolean | number | undefined>) => string;
export type NodeOptions<T> = {
    getId: (item: T) => string;
    getChildrenIds: (item: T) => Array<string | undefined>;
};
export declare const topologicalSort: <T>(items: T[], { getId, getChildrenIds }: NodeOptions<T>) => T[];
export declare const getSchemaItemId: (item: SchemaItem) => string;
export declare const getSchemaItemChildrenIds: (ctx: BaseContext, { type, object }: SchemaItem, items: SchemaItem[]) => Array<string | undefined>;
