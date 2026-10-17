import { DatabaseSchema, SchemaFromDatabaseOptions } from './types.js';
/**
Load schema from a database url
*/
export declare const schemaFromDatabase: (options?: SchemaFromDatabaseOptions) => Promise<DatabaseSchema>;
