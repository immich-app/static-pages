export declare const ORDER_FILENAME = "ORDER";
export declare const computeOrder: (fileNames: string[]) => string[];
export declare const parseOrder: (content: string) => string[];
export type VerifyOrderInput = {
    actual: string[];
    expected: string[];
    appendOnlyFrom?: string[];
};
export declare const verifyOrderContent: ({ actual, expected, appendOnlyFrom }: VerifyOrderInput) => string[];
export declare const listMigrationNames: (folder: string) => string[];
export declare const readOrder: (folder: string) => string[] | undefined;
export declare const writeOrder: (folder: string, names: string[]) => void;
export declare const syncOrder: (folder: string) => {
    previous?: string[];
    next: string[];
    changed: boolean;
};
export declare const maybeSyncOrder: (folder: string) => boolean;
export type VerifyOrderOptions = {
    appendOnlyFrom?: string[];
};
export declare const verifyOrder: (folder: string, { appendOnlyFrom }?: VerifyOrderOptions) => string[];
