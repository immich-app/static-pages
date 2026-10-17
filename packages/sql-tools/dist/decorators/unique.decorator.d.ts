export type UniqueOptions = {
    name?: string;
    columns: string[];
    synchronize?: boolean;
};
export declare const Unique: (options: UniqueOptions) => ClassDecorator;
