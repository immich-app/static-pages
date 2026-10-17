import { TriggerOptions } from './trigger.decorator.js';
import { DatabaseFunction } from '../types.js';
export type TriggerFunctionOptions = Omit<TriggerOptions, 'functionName'> & {
    function: DatabaseFunction;
};
export declare const TriggerFunction: (options: TriggerFunctionOptions) => ClassDecorator;
