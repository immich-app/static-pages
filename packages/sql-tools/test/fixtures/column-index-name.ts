import { Column, Table } from 'src';

@Table()
export class Table1 {
  @Column({ indexName: 'IDX_test' })
  column1!: string;
}

export const description = 'should create a column with an index if a name is provided';
