import { SqlTransformer } from './types.js';
import { ColumnChanges } from '../types.js';
export declare const transformColumns: SqlTransformer;
export declare const asColumnAlter: (tableName: string, columnName: string, changes: ColumnChanges) => string[];
