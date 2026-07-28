import { Comparer, DatabaseFunction, Reason } from 'src/types';

export const compareFunctions = (): Comparer<DatabaseFunction> => ({
  onMissing: (source) => [{ type: 'FunctionCreate', object: source, reason: Reason.MissingInTarget }],
  onExtra: (target) => [{ type: 'FunctionDrop', object: target, reason: Reason.MissingInSource }],
  onCompare: (source, target) => {
    if (source.expression !== target.expression) {
      const reason = `function expression has changed (${source.expression} vs ${target.expression})`;
      return [{ type: 'FunctionCreate', object: source, reason }];
    }

    return [];
  },
});
