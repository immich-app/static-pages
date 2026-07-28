import { Comparer, DatabaseEnum, Reason } from 'src/types';

export const compareEnums = (): Comparer<DatabaseEnum> => ({
  onMissing: (source) => [{ type: 'EnumCreate', object: source, reason: Reason.MissingInTarget }],
  onExtra: (target) => [{ type: 'EnumDrop', object: target, reason: Reason.MissingInSource }],
  onCompare: (source, target) => {
    if (source.values.toString() !== target.values.toString()) {
      // TODO add or remove values if the lists are different or the order has changed
      const reason = `enum values has changed (${source.values} vs ${target.values})`;
      return [
        { type: 'EnumDrop', object: target, reason },
        { type: 'EnumCreate', object: source, reason },
      ];
    }

    return [];
  },
});
