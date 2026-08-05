import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, parse } from 'node:path';

// no extension means kysely ignores this
export const ORDER_FILENAME = 'ORDER';

const isEqual = (a: string[], b: string[]) => a.length === b.length && a.every((item, i) => b[i] === item);

const findDuplicates = (names: string[]): string[] => [
  ...new Set(names.filter((name, index) => names.indexOf(name) !== index)),
];

export const computeOrder = (fileNames: string[]): string[] =>
  fileNames
    .filter((name) => name !== ORDER_FILENAME)
    .map((name) => parse(name).name)
    .toSorted();

export const parseOrder = (content: string): string[] =>
  content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const findPrefixViolation = (base: string[], current: string[]): string | undefined => {
  if (base.length > current.length) {
    return `${ORDER_FILENAME} has fewer entries (${current.length}) than the baseline (${base.length}); migrations cannot be removed`;
  }

  const index = base.findIndex((name, i) => current[i] !== name);
  return index === -1
    ? undefined
    : `${ORDER_FILENAME} is not append-only: expected "${base[index]}" at position ${index + 1}, found "${current[index]}". New migrations must sort after all existing migrations`;
};

export type VerifyOrderInput = { actual: string[]; expected: string[]; appendOnlyFrom?: string[] };

export const verifyOrderContent = ({ actual, expected, appendOnlyFrom }: VerifyOrderInput): string[] => {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);

  const errors = [
    ...findDuplicates(expected).map((name) => `Duplicate migration name "${name}"`),
    ...findDuplicates(actual).map((name) => `Duplicate ${ORDER_FILENAME} entry "${name}"`),
    ...[...expectedSet.difference(actualSet)].map((name) => `Migration "${name}" is missing from ${ORDER_FILENAME}`),
    ...[...actualSet.difference(expectedSet)].map(
      (name) => `"${name}" is listed in ${ORDER_FILENAME} but does not exist`,
    ),
  ];

  if (errors.length === 0 && !isEqual(actual, expected)) {
    errors.push(`${ORDER_FILENAME} entries are out of order (expected sorted migration names)`);
  }

  if (errors.length === 0 && appendOnlyFrom) {
    const violation = findPrefixViolation(appendOnlyFrom, actual);
    if (violation) {
      errors.push(violation);
    }
  }

  return errors;
};

export const listMigrationNames = (folder: string): string[] =>
  computeOrder(
    readdirSync(folder, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name),
  );

export const readOrder = (folder: string): string[] | undefined => {
  const path = join(folder, ORDER_FILENAME);
  return existsSync(path) ? parseOrder(readFileSync(path, 'utf8')) : undefined;
};

export const writeOrder = (folder: string, names: string[]): void => {
  writeFileSync(join(folder, ORDER_FILENAME), names.map((name) => `${name}\n`).join(''));
};

export const syncOrder = (folder: string): { previous?: string[]; next: string[]; changed: boolean } => {
  const previous = readOrder(folder);
  const next = listMigrationNames(folder);
  const changed = previous === undefined || !isEqual(previous, next);
  if (changed) {
    writeOrder(folder, next);
  }

  return { previous, next, changed };
};

export const maybeSyncOrder = (folder: string): boolean =>
  existsSync(join(folder, ORDER_FILENAME)) ? syncOrder(folder).changed : false;

export type VerifyOrderOptions = { appendOnlyFrom?: string[] };

export const verifyOrder = (folder: string, { appendOnlyFrom }: VerifyOrderOptions = {}): string[] => {
  const actual = readOrder(folder);
  if (actual === undefined) {
    return [`Missing ${ORDER_FILENAME} file in ${folder} (run \`sql-tools migrations sync-order\` to create it)`];
  }

  return verifyOrderContent({ actual, expected: listMigrationNames(folder), appendOnlyFrom });
};
