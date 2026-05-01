import { TriggerFunction, TriggerFunctionOptions } from 'src/decorators/trigger-function.decorator';

export const BeforeUpdateTrigger = (options: Omit<TriggerFunctionOptions, 'timing' | 'actions'>) =>
  TriggerFunction({
    timing: 'before',
    actions: ['update'],
    ...options,
  });
