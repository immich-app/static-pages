import { Column, registerEnum, Table } from 'src';

enum TestEnum {
  A = 'a',
  B = 'b',
}

const test_enum = registerEnum({ name: 'test_enum', values: Object.values(TestEnum) });

@Table()
export class Table1 {
  @Column({ array: true, enum: test_enum })
  column1!: TestEnum[];

  @Column({ array: true, enum: test_enum, default: [TestEnum.A] })
  column2!: TestEnum[];

  @Column({ array: true, enum: test_enum, default: [TestEnum.A, TestEnum.B] })
  column3!: TestEnum[];
}

export const description = 'should accept an array enum type';
