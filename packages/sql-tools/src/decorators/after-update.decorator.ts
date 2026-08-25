import { TriggerFunction, TriggerFunctionOptions } from 'src/decorators/trigger-function.decorator.js';

export const AfterUpdateTrigger = (options: Omit<TriggerFunctionOptions, 'timing' | 'actions'>) =>
  TriggerFunction({
    timing: 'after',
    actions: ['update'],
    ...options,
  });
