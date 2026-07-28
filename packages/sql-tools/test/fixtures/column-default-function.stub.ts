import { Column, Table } from 'src';

@Table()
export class Table1 {
  @Column({ type: 'character varying', default: () => 'now()' })
  column1!: string;
}

export const description = 'should register a table with a column with a default function';
