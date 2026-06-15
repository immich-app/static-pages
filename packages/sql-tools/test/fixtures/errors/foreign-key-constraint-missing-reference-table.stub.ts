import { Column, ForeignKeyConstraint, Table } from 'src';

class Foo {}

@Table()
@ForeignKeyConstraint({
  columns: ['parentId'],
  referenceTable: () => Foo,
})
export class Table1 {
  @Column()
  parentId!: string;
}

export const description = 'should detect an invalid reference table';
export const message = '[@ForeignKeyConstraint.referenceTable] Unable to find table (Foo)';
