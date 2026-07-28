import { AfterDeleteTrigger, registerFunction, Table } from 'src';

const test_fn = registerFunction({
  name: 'test_fn',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      SELECT 1;
      RETURN NULL;
    END`,
});

@Table()
@AfterDeleteTrigger({
  name: 'my_trigger',
  function: test_fn,
  scope: 'row',
})
export class Table1 {}

export const description = 'should create a trigger';
