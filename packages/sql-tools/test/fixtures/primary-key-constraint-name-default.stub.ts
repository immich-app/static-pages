import { PrimaryColumn, Table } from 'src/index.js';

@Table()
export class Table1 {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;
}

export const description = 'should add a primary key constraint to the table with a default name';
