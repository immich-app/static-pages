import { Column, Table } from 'src/index.js';

@Table()
export class Table1 {
  @Column({ type: 'character varying', default: null })
  column1!: string;
}

export const description = 'should register a nullable column from a default of null';
