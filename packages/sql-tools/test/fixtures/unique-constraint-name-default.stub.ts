import { Column, Table, Unique } from 'src';

@Table()
@Unique({ columns: ['id'] })
export class Table1 {
  @Column({ type: 'uuid' })
  id!: string;
}

export const description = 'should add a unique constraint to the table with a default name';
