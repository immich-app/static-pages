import { SqlTransformer } from './types.js';
import { DatabaseFunction } from '../types.js';
export declare const transformFunctions: SqlTransformer;
export declare const asFunctionCreate: (func: DatabaseFunction) => string;
