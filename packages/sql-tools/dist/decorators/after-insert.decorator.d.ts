import { TriggerFunctionOptions } from './trigger-function.decorator.js';
export declare const AfterInsertTrigger: (options: Omit<TriggerFunctionOptions, "timing" | "actions">) => ClassDecorator;
