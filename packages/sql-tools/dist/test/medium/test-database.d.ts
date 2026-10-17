import { DatabaseClient, DatabaseConnectionParams, SchemaDiffResult, SchemaFromCodeOptions } from '../../src/types.js';
export declare class TestDatabase {
    readonly name: string;
    kysely: DatabaseClient;
    connection: DatabaseConnectionParams;
    private constructor();
    static create(): Promise<TestDatabase>;
    destroy(): Promise<void>;
    diff(options: SchemaFromCodeOptions): Promise<{
        up: SchemaDiffResult;
        down: SchemaDiffResult;
    }>;
    query({ asSql }: SchemaDiffResult): Promise<string>;
    debug(message: string): string;
    schemaFromDatabase(): Promise<import('../../src/types.js').DatabaseSchema>;
}
