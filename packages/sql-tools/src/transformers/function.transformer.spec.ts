import { BaseContext } from 'src/contexts/base-context';
import { transformFunctions } from 'src/transformers/function.transformer';
import { DatabaseFunction } from 'src/types';
import { describe, expect, it } from 'vitest';

const ctx = new BaseContext({});

describe(transformFunctions.name, () => {
  describe('FunctionDrop', () => {
    it('should work', () => {
      expect(
        transformFunctions(ctx, {
          type: 'FunctionDrop',
          object: { name: 'test_func' } as DatabaseFunction,
          reason: 'unknown',
        }),
      ).toEqual(`DROP FUNCTION test_func;`);
    });
  });
});
