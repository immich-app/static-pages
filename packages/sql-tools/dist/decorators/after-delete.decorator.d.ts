import { TriggerFunctionOptions } from './trigger-function.decorator.js';
export declare const AfterDeleteTrigger: (options: Omit<TriggerFunctionOptions, "timing" | "actions">) => ClassDecorator;
