import { Column, Index, Table } from 'src/index.js';

@Table()
@Index({ columns: ['id'] })
export class Table1 {
  @Column({ type: 'uuid' })
  id!: string;
}

export const description = 'should create an index with a default name';
