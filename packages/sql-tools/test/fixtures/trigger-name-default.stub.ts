import { registerFunction, Table, Trigger } from 'src';

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
@Trigger({
  timing: 'before',
  actions: ['insert'],
  scope: 'row',
  functionName: test_fn.name,
})
export class Table1 {}

export const description = 'should register a trigger with a default name';
