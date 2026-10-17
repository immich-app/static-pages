import { DatabaseColumn, Reason, SchemaDiff } from '../types.js';
export declare const compareColumns: () => {
    getRenameKey: (column: DatabaseColumn) => string;
    onRename: (source: DatabaseColumn, target: DatabaseColumn) => {
        type: "ColumnRename";
        object: {
            old: DatabaseColumn;
            new: DatabaseColumn;
        };
        reason: Reason;
    }[];
    onMissing: (source: DatabaseColumn) => {
        type: "ColumnAdd";
        object: DatabaseColumn;
        reason: Reason;
    }[];
    onExtra: (target: DatabaseColumn) => {
        type: "ColumnDrop";
        object: DatabaseColumn;
        reason: Reason;
    }[];
    onCompare: (source: DatabaseColumn, target: DatabaseColumn) => SchemaDiff[];
};
