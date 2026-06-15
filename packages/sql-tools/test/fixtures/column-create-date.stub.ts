import { CreateDateColumn, Table } from 'src';

@Table()
export class Table1 {
  @CreateDateColumn()
  createdAt!: string;
}

export const description = 'should register a table with an created at date column';
