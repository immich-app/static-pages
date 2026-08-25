import { Trigger, TriggerOptions } from 'src/decorators/trigger.decorator.js';
import { DatabaseFunction } from 'src/types.js';

export type TriggerFunctionOptions = Omit<TriggerOptions, 'functionName'> & { function: DatabaseFunction };
export const TriggerFunction = (options: TriggerFunctionOptions) =>
  Trigger({
    name: options.function.name,
    ...options,
    functionName: options.function.name,
  });
