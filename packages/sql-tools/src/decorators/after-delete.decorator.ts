import { TriggerFunction, TriggerFunctionOptions } from 'src/decorators/trigger-function.decorator.js';

export const AfterDeleteTrigger = (options: Omit<TriggerFunctionOptions, 'timing' | 'actions'>) =>
  TriggerFunction({
    timing: 'after',
    actions: ['delete'],
    ...options,
  });
