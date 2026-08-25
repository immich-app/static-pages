import { Column, Table } from 'src/index.js';

@Table()
export class Table1 {
  @Column({ type: 'integer', default: 0 })
  column1!: string;
}

export const description = 'should register a table with a column with a default value (number)';
