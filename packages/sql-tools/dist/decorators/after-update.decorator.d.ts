import { TriggerFunctionOptions } from './trigger-function.decorator.js';
export declare const AfterUpdateTrigger: (options: Omit<TriggerFunctionOptions, "timing" | "actions">) => ClassDecorator;
