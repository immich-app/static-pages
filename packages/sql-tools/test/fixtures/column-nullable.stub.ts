import { Column, Table } from 'src';

@Table()
export class Table1 {
  @Column({ nullable: true })
  column1!: string;
}

export const description = 'should set nullable correctly';
