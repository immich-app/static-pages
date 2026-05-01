import { Column, ForeignKeyConstraint, PrimaryColumn, Table } from 'src';

@Table()
export class Table1 {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;
}

@Table()
@ForeignKeyConstraint({ columns: ['parentId'], referenceTable: () => Table1, referenceColumns: ['foo'] })
export class Table2 {
  @Column({ type: 'uuid' })
  parentId!: string;
}

export const description = 'should detect invalid column references in foreign key constraint';
export const message = '[@ForeignKeyConstraint.referenceColumns] Unable to find column (Table1.foo)';
