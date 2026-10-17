import { TriggerFunctionOptions } from './trigger-function.decorator.js';
export declare const BeforeUpdateTrigger: (options: Omit<TriggerFunctionOptions, "timing" | "actions">) => ClassDecorator;
