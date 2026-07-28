import { Column, Table } from 'src';

@Table()
export class Table1 {
  @Column({ type: 'character varying', default: null })
  column1!: string;
}

export const description = 'should register a nullable column from a default of null';
