import { SqlTransformer } from './types.js';
import { DatabaseTrigger } from '../types.js';
export declare const transformTriggers: SqlTransformer;
export declare const asTriggerCreate: (trigger: DatabaseTrigger) => string;
export declare const asTriggerDrop: (tableName: string, triggerName: string) => string;
