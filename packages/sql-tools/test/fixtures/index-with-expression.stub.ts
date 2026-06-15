import { Column, Index, Table } from 'src';

@Table()
@Index({ expression: `(("column1" at time zone 'UTC')::date)` })
export class Table1 {
  @Column({ type: 'timestamp with time zone', nullable: true })
  column1!: Date;
}

export const description = 'should create an index based off of an expression';
