import { default as postgres } from 'postgres';
import { DatabaseConnectionParams, DatabasePostgresOptions, PostgresSsl } from '../types.js';
export declare const isPostgresSsl: (ssl?: string | boolean | object) => ssl is PostgresSsl;
export declare const asPostgresConfig: (params: DatabaseConnectionParams) => {
    host: string | undefined;
    port: number | undefined;
    username: string | undefined;
    password: string | undefined;
    database: string | undefined;
    ssl: PostgresSsl | undefined;
};
export declare const createPostgres: (options?: DatabasePostgresOptions) => postgres.Sql<{}>;
