import { Column, Table } from 'src';

const date = new Date(2023, 0, 1);

@Table()
export class Table1 {
  @Column({ type: 'character varying', default: date })
  column1!: string;
}

export const description = 'should register a table with a column with a default value (date)';
