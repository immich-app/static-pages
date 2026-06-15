import { Column, Table } from 'src';

@Table()
export class Table1 {
  @Column({ name: 'column-1' })
  column1!: string;
}

export const description = 'should register a table with a column with a specific name';
