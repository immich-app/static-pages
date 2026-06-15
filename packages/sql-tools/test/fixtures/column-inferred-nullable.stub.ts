import { Column, Table } from 'src';

@Table()
export class Table1 {
  @Column({ default: null })
  column1!: string;
}

export const description = 'should infer nullable from the default value';
