import { ForeignKeyColumn, Index, PrimaryColumn, Table } from 'src';

@Table()
export class Table1 {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;
}

@Table()
export class Table2 {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;
}

@Table()
@Index({ columns: ['table1Id', 'table2Id'] })
@Index({ columns: ['table2Id', 'table1Id'] })
export class Table3 {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @ForeignKeyColumn(() => Table1, { index: false })
  table1Id!: string;

  @ForeignKeyColumn(() => Table2, { index: false })
  table2Id!: string;
}

export const description = 'should create an index using two foreign key constraints';
