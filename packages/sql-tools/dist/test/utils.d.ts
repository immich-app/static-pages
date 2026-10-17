import { Kysely } from 'kysely';
import { DatabaseConnectionParams } from '../src/types.js';
export declare const getDirectoryFiles: (directory: string) => [string, string][];
export declare const importFixture: (file: string) => Promise<any>;
export declare const getKyselyDB: <T = unknown>(suffix?: string) => Promise<{
    name: string;
    connection: DatabaseConnectionParams;
    kysely: Kysely<T>;
}>;
