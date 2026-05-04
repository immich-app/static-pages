import { Column, Table } from 'src';

@Table()
export class Table1 {
  @Column({ type: 'boolean', default: true })
  column1!: boolean;
}

export const description = 'should register a table with a column with a default value (boolean)';
