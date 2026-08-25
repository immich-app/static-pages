import { PrimaryGeneratedColumn, Table } from 'src/index.js';

@Table()
export class Table1 {
  @PrimaryGeneratedColumn({ strategy: 'uuid' })
  column1!: string;
}

export const description = 'should register a table with a primary generated uuid column';
