import { Column, Table, Unique } from 'src';

@Table()
@Unique({ name: 'UQ_test', columns: ['id'] })
export class Table1 {
  @Column({ type: 'uuid' })
  id!: string;
}

export const description = 'should add a unique constraint to the table with a specific name';
