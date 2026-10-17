export type IndexOptions = {
    name?: string;
    unique?: boolean;
    expression?: string;
    using?: string;
    with?: string;
    where?: string;
    columns?: string[];
    synchronize?: boolean;
};
export declare const Index: (options?: string | IndexOptions) => ClassDecorator;
