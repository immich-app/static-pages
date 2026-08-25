import { Column, Table } from 'src/index.js';

@Table()
export class Table1 {
  @Column({ default: null })
  column1!: string;
}

export const description = 'should infer nullable from the default value';
