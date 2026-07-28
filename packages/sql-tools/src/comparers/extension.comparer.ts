import { Comparer, DatabaseExtension, Reason } from 'src/types';

export const compareExtensions = (): Comparer<DatabaseExtension> => ({
  onMissing: (source) => [{ type: 'ExtensionCreate', object: source, reason: Reason.MissingInTarget }],
  onExtra: (target) => [{ type: 'ExtensionDrop', object: target, reason: Reason.MissingInSource }],
  onCompare: () => {
    // if the name matches they are the same
    return [];
  },
});
