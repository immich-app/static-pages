import { Column, Table } from 'src';

@Table()
export class Table1 {
  @Column({ type: 'character varying', default: [] })
  column0!: string[];

  @Column({ type: 'character varying', default: ['a', 'b"', '', ' hello world '] })
  column1!: string[];

  @Column({ type: 'character varying', default: [1, 2, 3] })
  column2!: string[];

  @Column({ type: 'character varying', default: [null] })
  column3!: string[];
}

export const description = 'should register a table with a column with a default value (array)';
