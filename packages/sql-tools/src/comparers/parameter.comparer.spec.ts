import { compareParameters } from 'src/comparers/parameter.comparer.js';
import { DatabaseParameter, Reason } from 'src/types.js';
import { describe, expect, it } from 'vitest';

const testParameter: DatabaseParameter = {
  name: 'test',
  databaseName: 'immich',
  value: 'on',
  scope: 'database',
  synchronize: true,
};

describe('compareParameters', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareParameters().onExtra(testParameter)).toEqual([
        {
          type: 'ParameterReset',
          object: testParameter,
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareParameters().onMissing(testParameter)).toEqual([
        {
          type: 'ParameterSet',
          object: testParameter,
          reason: Reason.MissingInTarget,
        },
      ]);
    });
  });

  describe('onCompare', () => {
    it('should work', () => {
      expect(compareParameters().onCompare(testParameter, testParameter)).toEqual([]);
    });
  });
});
