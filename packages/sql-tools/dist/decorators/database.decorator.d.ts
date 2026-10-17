export type DatabaseOptions = {
    name?: string;
    synchronize?: boolean;
};
export declare const Database: (options: DatabaseOptions) => ClassDecorator;
