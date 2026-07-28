import { Column, Table } from 'src';

@Table()
export class Table1 {
  @Column({ index: true })
  column1!: string;
}

export const description = 'should create a column with an index';
