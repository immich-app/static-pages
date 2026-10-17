import { SqlTransformer } from './types.js';
import { DatabaseIndex } from '../types.js';
export declare const transformIndexes: SqlTransformer;
export declare const asIndexCreate: (index: DatabaseIndex) => string;
