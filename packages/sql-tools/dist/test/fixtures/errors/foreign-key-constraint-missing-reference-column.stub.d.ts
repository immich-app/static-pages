export declare class Table1 {
    id: string;
}
export declare class Table2 {
    parentId: string;
}
export declare const description = "should detect invalid column references in foreign key constraint";
export declare const message = "[@ForeignKeyConstraint.referenceColumns] Unable to find column (Table1.foo)";
