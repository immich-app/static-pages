import { ForeignKeyColumn, PrimaryColumn, Table } from 'src';

@Table()
export class Table1 {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;
}

@Table()
export class Table2 {
  @ForeignKeyColumn(() => Table1, {})
  parentId!: string;
}

export const description = 'should infer the column type from the reference column';
