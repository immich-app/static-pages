export type CheckOptions = {
    name?: string;
    expression: string;
    synchronize?: boolean;
};
export declare const Check: (options: CheckOptions) => ClassDecorator;
