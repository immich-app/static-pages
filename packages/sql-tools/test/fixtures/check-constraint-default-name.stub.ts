import { Check, Column, Table } from 'src/index.js';

@Table()
@Check({ expression: '1=1' })
export class Table1 {
  @Column({ type: 'uuid' })
  id!: string;
}

export const description = 'should create a check constraint with a default name';
