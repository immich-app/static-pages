import { Comparer, DatabaseOverride, Reason } from 'src/types';

export const compareOverrides = (): Comparer<DatabaseOverride> => ({
  onMissing: (source) => [{ type: 'OverrideCreate', object: source, reason: Reason.MissingInTarget }],
  onExtra: (target) => [{ type: 'OverrideDrop', object: target, reason: Reason.MissingInSource }],
  onCompare: (source, target) => {
    if (source.value.name !== target.value.name || source.value.sql !== target.value.sql) {
      const sourceValue = JSON.stringify(source.value);
      const targetValue = JSON.stringify(target.value);
      return [
        { type: 'OverrideUpdate', object: source, reason: `value is different (${sourceValue} vs ${targetValue})` },
      ];
    }

    return [];
  },
});
