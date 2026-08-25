import { DeleteDateColumn, Table } from 'src/index.js';

@Table()
export class Table1 {
  @DeleteDateColumn()
  deletedAt!: string;
}

export const description = 'should register a table with a deleted at date column';
