import { TriggerAction, TriggerScope, TriggerTiming } from '../types.js';
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
export declare const Trigger: (options: TriggerOptions) => ClassDecorator;
