import { register } from 'src/register';
import { TriggerAction, TriggerScope, TriggerTiming } from 'src/types';

export type TriggerOptions = {
  name?: string;
  timing: TriggerTiming;
  actions: TriggerAction[];
  scope: TriggerScope;
  functionName: string;
  referencingNewTableAs?: string;
  referencingOldTableAs?: string;
  when?: string;
  synchronize?: boolean;
};

export const Trigger = (options: TriggerOptions): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (object: Function) => void register({ type: 'trigger', item: { object, options } });
};
