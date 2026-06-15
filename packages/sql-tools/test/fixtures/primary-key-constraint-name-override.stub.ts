import { PrimaryColumn, Table } from 'src';

@Table({ primaryConstraintName: 'PK_test' })
export class Table1 {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;
}

export const description = 'should add a primary key constraint to the table with a specific name';
