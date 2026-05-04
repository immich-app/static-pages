import { Column, Table } from 'src';

@Table()
export class Table1 {
  @Column({ type: 'uuid', unique: true })
  id!: string;
}

export const description = 'should create a unique key constraint with a default name';
