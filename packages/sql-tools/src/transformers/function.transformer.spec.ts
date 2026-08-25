import { BaseContext } from 'src/contexts/base-context.js';
import { transformFunctions } from 'src/transformers/function.transformer.js';
import { DatabaseFunction } from 'src/types.js';
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
