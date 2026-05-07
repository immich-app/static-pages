import { Column, Index, Table } from 'src';

@Table()
@Index({ columns: ['column1'], where: '"column1" IS NOT NULL' })
export class Table1 {
  @Column({ nullable: true })
  column1!: string;
}

export const description = 'should create an index with a where clause';
