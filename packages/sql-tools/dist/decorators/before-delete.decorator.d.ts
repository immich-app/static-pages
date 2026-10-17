import { TriggerFunctionOptions } from './trigger-function.decorator.js';
export declare const BeforeDeleteTrigger: (options: Omit<TriggerFunctionOptions, "timing" | "actions">) => ClassDecorator;
