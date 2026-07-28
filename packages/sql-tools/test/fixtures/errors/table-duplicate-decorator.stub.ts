import { Table } from 'src';

@Table({ name: 'table-1' })
@Table({ name: 'table-2' })
export class Table1 {}

export const description = 'should detect duplicate table names';
export const message = 'Table table-2 has already been registered';
