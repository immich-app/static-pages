import { Comparer, DatabaseParameter, Reason } from 'src/types';

export const compareParameters = (): Comparer<DatabaseParameter> => ({
  onMissing: (source) => [{ type: 'ParameterSet', object: source, reason: Reason.MissingInTarget }],
  onExtra: (target) => [{ type: 'ParameterReset', object: target, reason: Reason.MissingInSource }],
  onCompare: () => {
    // TODO
    return [];
  },
});
