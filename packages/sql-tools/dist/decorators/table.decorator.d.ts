export type TableOptions = {
    name?: string;
    primaryConstraintName?: string;
    synchronize?: boolean;
};
/**
Table comments here
*/
export declare const Table: (options?: string | TableOptions) => ClassDecorator;
