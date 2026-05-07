import { DeleteDateColumn, Table } from 'src';

@Table()
export class Table1 {
  @DeleteDateColumn()
  deletedAt!: string;
}

export const description = 'should register a table with a deleted at date column';
