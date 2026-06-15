import { Column, ForeignKeyConstraint, PrimaryColumn, Table } from 'src';

@Table()
export class Table1 {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;
}

@Table()
@ForeignKeyConstraint({ columns: ['parentId2'], referenceTable: () => Table1 })
export class Table2 {
  @Column({ type: 'uuid' })
  parentId!: string;
}

export const description = 'should detect invalid foreign key constraint columns';
export const message = '[@ForeignKeyConstraint.columns] Unable to find column (Table2.parentId2)';
