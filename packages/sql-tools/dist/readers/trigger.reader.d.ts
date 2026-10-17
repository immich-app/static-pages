import { Reader, TriggerAction, TriggerScope, TriggerTiming } from '../types.js';
export declare const readTriggers: Reader;
export declare const parseTriggerWhen: (definition: string) => string | undefined;
export declare const hasMask: (input: number, mask: number) => boolean;
export declare const parseTriggerType: (type: number) => {
    actions: TriggerAction[];
    timing: TriggerTiming;
    scope: TriggerScope;
};
