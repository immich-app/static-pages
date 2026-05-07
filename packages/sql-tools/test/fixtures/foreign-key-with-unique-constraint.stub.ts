import { ForeignKeyColumn, PrimaryColumn, Table } from 'src';

@Table()
export class Table1 {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;
}

@Table()
export class Table2 {
  @ForeignKeyColumn(() => Table1, { unique: true })
  parentId!: string;
}

export const description = 'should create a foreign key constraint with a unique constraint';
