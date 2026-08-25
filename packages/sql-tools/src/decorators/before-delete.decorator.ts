import { TriggerFunction, TriggerFunctionOptions } from 'src/decorators/trigger-function.decorator.js';

export const BeforeDeleteTrigger = (options: Omit<TriggerFunctionOptions, 'timing' | 'actions'>) =>
  TriggerFunction({
    timing: 'before',
    actions: ['delete'],
    ...options,
  });
