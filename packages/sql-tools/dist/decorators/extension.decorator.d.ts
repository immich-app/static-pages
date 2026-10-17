export type ExtensionOptions = {
    name: string;
    synchronize?: boolean;
};
export declare const Extension: (options: string | ExtensionOptions) => ClassDecorator;
