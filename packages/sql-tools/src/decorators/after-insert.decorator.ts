import { TriggerFunction, TriggerFunctionOptions } from 'src/decorators/trigger-function.decorator.js';

export const AfterInsertTrigger = (options: Omit<TriggerFunctionOptions, 'timing' | 'actions'>) =>
  TriggerFunction({
    timing: 'after',
    actions: ['insert'],
    ...options,
  });
