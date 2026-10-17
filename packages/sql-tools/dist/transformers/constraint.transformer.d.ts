import { SqlTransformer } from './types.js';
import { DatabaseConstraint } from '../types.js';
export declare const transformConstraints: SqlTransformer;
export declare const asConstraintBody: (constraint: DatabaseConstraint) => string;
