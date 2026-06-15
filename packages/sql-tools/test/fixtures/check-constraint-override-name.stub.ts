import { Check, Column, Table } from 'src';

@Table()
@Check({ name: 'CHK_test', expression: '1=1' })
export class Table1 {
  @Column({ type: 'uuid' })
  id!: string;
}

export const description = 'should create a check constraint with a specific name';
