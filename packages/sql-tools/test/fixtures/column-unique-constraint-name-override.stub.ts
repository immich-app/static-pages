import { Column, Table } from 'src';

@Table()
export class Table1 {
  @Column({ type: 'uuid', unique: true, uniqueConstraintName: 'UQ_test' })
  id!: string;
}

export const description = 'should create a unique key constraint with a specific name';
