import { Kysely } from 'kysely';
import { DatabaseConnectionParams, UuidFunctionFactory } from './index.js';
declare const defaultUuidFactory: ({ db, major }: {
    db: string;
    major: string;
}) => UuidFunctionFactory;
export declare class Migrator {
    #private;
    constructor(options: {
        connectionParams: DatabaseConnectionParams;
        allowUnorderedMigrations: boolean;
        migrationFolder: string;
        uuidFactory?: typeof defaultUuidFactory;
    });
    getDatabase(): Kysely<unknown>;
    runMigrations(): Promise<void>;
    revert(sourceFolder: string): Promise<void>;
    generate({ dist, targetPath, withComments }: {
        dist: string;
        targetPath: string;
        withComments: boolean;
    }): Promise<void>;
    create(path: string, up: string[], down: string[]): void;
    destroy(): Promise<void>;
}
export {};
