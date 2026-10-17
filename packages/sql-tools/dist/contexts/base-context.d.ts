import { NamingItem } from '../naming/naming.interface.js';
import { BaseContextOptions, DatabaseEnum, DatabaseExtension, DatabaseFunction, DatabaseOverride, DatabaseParameter, DatabaseSchema, DatabaseTable, OutputTarget, UuidFunctionFactory } from '../types.js';
export declare class BaseContext {
    databaseName: string;
    schemaName: string;
    overrideTableName: string;
    uuidFunctionFactory: UuidFunctionFactory;
    outputTarget: OutputTarget;
    tables: DatabaseTable[];
    functions: DatabaseFunction[];
    enums: DatabaseEnum[];
    extensions: DatabaseExtension[];
    parameters: DatabaseParameter[];
    overrides: DatabaseOverride[];
    warnings: string[];
    private namingStrategy;
    constructor(options: BaseContextOptions);
    getNameFor(item: NamingItem): string;
    getTableByName(name: string): DatabaseTable | undefined;
    warn(context: string, message: string): void;
    build(): DatabaseSchema;
}
