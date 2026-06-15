import { BaseContext } from 'src/contexts/base-context';
import { transformExtensions } from 'src/transformers/extension.transformer';
import { describe, expect, it } from 'vitest';

const ctx = new BaseContext({});

describe(transformExtensions.name, () => {
  describe('ExtensionDrop', () => {
    it('should work', () => {
      expect(
        transformExtensions(ctx, {
          type: 'ExtensionDrop',
          object: { name: 'cube', synchronize: true },
          reason: 'unknown',
        }),
      ).toEqual(`DROP EXTENSION "cube";`);
    });
  });

  describe('ExtensionCreate', () => {
    it('should work', () => {
      expect(
        transformExtensions(ctx, {
          type: 'ExtensionCreate',
          object: { name: 'cube', synchronize: true },
          reason: 'unknown',
        }),
      ).toEqual(`CREATE EXTENSION IF NOT EXISTS "cube";`);
    });
  });
});
