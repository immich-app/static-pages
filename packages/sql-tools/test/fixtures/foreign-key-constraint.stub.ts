import { Column, ForeignKeyConstraint, PrimaryColumn, Table } from 'src';

@Table()
export class Table1 {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;
}

@Table()
@ForeignKeyConstraint({ columns: ['parentId'], referenceTable: () => Table1 })
export class Table2 {
  @Column({ type: 'uuid' })
  parentId!: string;
}

export const description = 'should create a foreign key constraint to the target table';
