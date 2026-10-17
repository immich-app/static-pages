import { DatabaseSchema, SchemaDiff, SchemaDiffOptions, SchemaDiffResult, SchemaDiffToSqlOptions } from './types.js';
/**
Compute the difference between two database schemas
*/
export declare const schemaDiff: (source: DatabaseSchema, target: DatabaseSchema, options?: SchemaDiffOptions) => SchemaDiffResult;
/**
Convert schema diffs into SQL statements
*/
export declare const schemaDiffToSql: (items: SchemaDiff[], options?: SchemaDiffToSqlOptions) => string[];
/**
Convert schema diff into human readable statements
*/
export declare const schemaDiffToHuman: (items: SchemaDiff[]) => string[];
export declare const asSql: (item: SchemaDiff, options: SchemaDiffToSqlOptions) => string[];
export declare const asHuman: ({ object, type }: SchemaDiff) => string;
