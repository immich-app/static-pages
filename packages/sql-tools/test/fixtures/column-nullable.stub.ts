import { Column, Table } from 'src/index.js';

@Table()
export class Table1 {
  @Column({ nullable: true })
  column1!: string;
}

export const description = 'should set nullable correctly';
