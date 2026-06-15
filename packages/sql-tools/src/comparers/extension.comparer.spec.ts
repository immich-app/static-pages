import { compareExtensions } from 'src/comparers/extension.comparer';
import { Reason } from 'src/types';
import { describe, expect, it } from 'vitest';

const testExtension = { name: 'test', synchronize: true };

describe('compareExtensions', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareExtensions().onExtra(testExtension)).toEqual([
        {
          type: 'ExtensionDrop',
          object: testExtension,
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareExtensions().onMissing(testExtension)).toEqual([
        {
          type: 'ExtensionCreate',
          object: testExtension,
          reason: Reason.MissingInTarget,
        },
      ]);
    });
  });

  describe('onCompare', () => {
    it('should work', () => {
      expect(compareExtensions().onCompare(testExtension, testExtension)).toEqual([]);
    });
  });
});
