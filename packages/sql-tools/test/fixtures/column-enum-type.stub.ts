import { Column, registerEnum, Table } from 'src';

enum Test {
  Foo = 'foo',
  Bar = 'bar',
}

const test_enum = registerEnum({ name: 'test_enum', values: Object.values(Test) });

@Table()
export class Table1 {
  @Column({ enum: test_enum })
  column1!: Test;

  @Column({ enum: test_enum, default: Test.Foo })
  column2!: Test;
}

export const description = 'should accept an enum type';
