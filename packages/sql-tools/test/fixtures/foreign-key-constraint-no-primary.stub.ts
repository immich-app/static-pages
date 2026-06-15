import { Column, ForeignKeyConstraint, Table } from 'src';

@Table()
export class Table1 {
  @Column({ unique: true })
  foo!: string;
}

@Table()
@ForeignKeyConstraint({
  columns: ['bar'],
  referenceTable: () => Table1,
  referenceColumns: ['foo'],
})
export class Table2 {
  @Column()
  bar!: string;
}

export const description = 'should create a foreign key constraint to the target table without a primary key';
