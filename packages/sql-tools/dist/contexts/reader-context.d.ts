import { BaseContext } from './base-context.js';
import { SchemaFromDatabaseOptions } from '../types.js';
export declare class ReaderContext extends BaseContext {
    options: SchemaFromDatabaseOptions;
    constructor(options: SchemaFromDatabaseOptions);
}
