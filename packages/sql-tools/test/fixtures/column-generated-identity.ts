import { PrimaryGeneratedColumn, Table } from 'src';

@Table()
export class Table1 {
  @PrimaryGeneratedColumn({ strategy: 'identity' })
  column1!: string;
}

export const description = 'should register a table with a generated identity column';
