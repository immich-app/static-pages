export type ForeignKeyAction = 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
export type ForeignKeyConstraintOptions = {
    name?: string;
    index?: boolean;
    indexName?: string;
    columns: string[];
    referenceTable: () => Function;
    referenceColumns?: string[];
    onUpdate?: ForeignKeyAction;
    onDelete?: ForeignKeyAction;
    synchronize?: boolean;
};
export declare const ForeignKeyConstraint: (options: ForeignKeyConstraintOptions) => ClassDecorator;
