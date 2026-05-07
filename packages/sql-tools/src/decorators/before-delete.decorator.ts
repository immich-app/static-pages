import { TriggerFunction, TriggerFunctionOptions } from 'src/decorators/trigger-function.decorator';

export const BeforeDeleteTrigger = (options: Omit<TriggerFunctionOptions, 'timing' | 'actions'>) =>
  TriggerFunction({
    timing: 'before',
    actions: ['delete'],
    ...options,
  });
