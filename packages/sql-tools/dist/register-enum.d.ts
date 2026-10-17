import { DatabaseEnum } from './types.js';
export type EnumOptions = {
    name: string;
    values: string[];
    synchronize?: boolean;
};
export declare const registerEnum: (options: EnumOptions) => DatabaseEnum;
