import { BaseContext } from './base-context.js';
import { TableOptions } from '../decorators/table.decorator.js';
import { DatabaseColumn, DatabaseTable, SchemaFromCodeOptions } from '../types.js';
type TableMetadata = {
    options: TableOptions;
    object: Function;
    methodToColumn: Map<string | symbol, DatabaseColumn>;
};
export declare class ProcessorContext extends BaseContext {
    options: SchemaFromCodeOptions;
    constructor(options: SchemaFromCodeOptions);
    classToTable: WeakMap<Function, DatabaseTable>;
    tableToMetadata: WeakMap<DatabaseTable, TableMetadata>;
    getTableByObject(object: Function): DatabaseTable | undefined;
    getTableMetadata(table: DatabaseTable): TableMetadata;
    addTable(table: DatabaseTable, options: TableOptions, object: Function): void;
    getColumnByObjectAndPropertyName(object: object, propertyName: string | symbol): {
        table?: DatabaseTable;
        column?: DatabaseColumn;
    };
    addColumn(table: DatabaseTable, input: DatabaseColumn, propertyName: string | symbol): void;
    onMissingTable(context: string, name: string): never;
    onMissingTable(context: string, object: object, propertyName?: symbol | string): never;
    onMissingColumn(context: string, name: string): never;
    onMissingColumn(context: string, object: object, propertyName?: symbol | string): never;
}
export {};
