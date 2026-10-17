import { ColumnType, DatabaseFunction } from './types.js';
export type FunctionOptions = {
    name: string;
    arguments?: string[];
    returnType: ColumnType | string;
    language?: 'SQL' | 'PLPGSQL';
    behavior?: 'immutable' | 'stable' | 'volatile';
    parallel?: 'safe' | 'unsafe' | 'restricted';
    strict?: boolean;
    synchronize?: boolean;
} & ({
    body: string;
} | {
    return: string;
});
export declare const registerFunction: (options: FunctionOptions) => DatabaseFunction;
