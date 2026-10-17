import { AfterUpdateTrigger, Column, registerFunction, Table } from 'src/index.js';

const test_fn = registerFunction({
  name: 'test_fn',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      RETURN NULL;
    END`,
});

@Table()
@AfterUpdateTrigger({
  name: 'my_trigger',
  function: test_fn,
  scope: 'row',
  when: 'OLD."column1" IS DISTINCT FROM NEW."column1"',
})
export class Table1 {
  @Column({ nullable: true })
  column1!: string;
}

export const description = 'should create a trigger with a when clause on the old and new rows';
