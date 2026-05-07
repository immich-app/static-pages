import { Column, Table } from 'src';

@Table()
export class Table1 {
  @Column({ length: 2 })
  column1!: string;
}

export const description = 'should use create a string column with a fixed length';
