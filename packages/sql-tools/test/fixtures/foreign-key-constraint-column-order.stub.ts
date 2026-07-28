import { Column, ForeignKeyConstraint, PrimaryColumn, Table } from 'src';

@Table()
export class Table1 {
  @PrimaryColumn({ type: 'uuid' })
  id1!: string;

  @PrimaryColumn({ type: 'uuid' })
  id2!: string;
}

@Table()
@ForeignKeyConstraint({
  columns: ['parentId1', 'parentId2'],
  referenceTable: () => Table1,
  referenceColumns: ['id2', 'id1'],
})
export class Table2 {
  @Column({ type: 'uuid' })
  parentId1!: string;

  @Column({ type: 'uuid' })
  parentId2!: string;
}

export const description = 'should create a foreign key constraint to the target table';
