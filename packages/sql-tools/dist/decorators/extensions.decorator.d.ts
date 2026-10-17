export type ExtensionsOptions = {
    name: string;
    synchronize?: boolean;
};
export declare const Extensions: (options: Array<string | ExtensionsOptions>) => ClassDecorator;
