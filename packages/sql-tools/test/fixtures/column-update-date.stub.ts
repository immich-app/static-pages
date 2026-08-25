import { Table, UpdateDateColumn } from 'src/index.js';

@Table()
export class Table1 {
  @UpdateDateColumn()
  updatedAt!: string;
}

export const description = 'should register a table with an updated at date column';
