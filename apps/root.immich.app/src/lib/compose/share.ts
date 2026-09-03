import { get, has, set } from 'lodash-es';
import { DEFAULT_CONFIG, FIELDS, immichConfigSchema, type ImmichConfig } from './config';

const PASSWORD_PATH = 'database.password';
const PASSWORD_MARKER = 'random';

const PASSWORD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export const randomPassword = () =>
  Array.from(
    crypto.getRandomValues(new Uint8Array(24)),
    (byte) => PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length],
  ).join('');

const leafEntries = (value: unknown, prefix = ''): [string, unknown][] =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([key, child]) => leafEntries(child, prefix ? `${prefix}.${key}` : key))
    : [[prefix, value]];

const DEFAULT_LEAVES = new Map(leafEntries(DEFAULT_CONFIG));

const ADVANCED_PATHS = Object.values(FIELDS)
  .filter((field) => 'advanced' in field)
  .flatMap((field) => field.config);

const coerce = (raw: string, path: string) => {
  const fallback = DEFAULT_LEAVES.get(path);
  if (typeof fallback === 'string') {
    return raw;
  }

  try {
    const value = JSON.parse(raw);
    return fallback === undefined || typeof value === typeof fallback ? value : undefined;
  } catch {
    return fallback === undefined ? raw : undefined;
  }
};

const resetToDefault = (draft: object, keys: (string | number | symbol)[]) => {
  while (keys.length > 0) {
    if (has(DEFAULT_CONFIG, keys)) {
      set(draft, keys, structuredClone(get(DEFAULT_CONFIG, keys)));
      return;
    }
    keys.pop();
  }
};

export const encodeShare = (config: ImmichConfig): URLSearchParams => {
  const params = new URLSearchParams();
  const libraries = config.storage.externalLibraries.filter((library) => library.path.trim());
  const shared = { ...config, storage: { ...config.storage, externalLibraries: libraries } };

  for (const [path, value] of leafEntries(shared)) {
    if (value === DEFAULT_LEAVES.get(path) || value === undefined || value === '') {
      continue;
    }
    params.set(path, path === PASSWORD_PATH ? PASSWORD_MARKER : String(value));
  }

  return params;
};

export const decodeShare = (params: URLSearchParams): ImmichConfig => {
  const draft = structuredClone(DEFAULT_CONFIG);
  const applied: string[] = [];

  for (const [path, raw] of params) {
    const value = path === PASSWORD_PATH ? (raw === PASSWORD_MARKER ? randomPassword() : undefined) : coerce(raw, path);
    if (value !== undefined) {
      set(draft, path, value);
      applied.push(path);
    }
  }

  let parsed = immichConfigSchema.safeParse(draft);

  if (!parsed.success) {
    for (const { path } of parsed.error.issues) {
      resetToDefault(draft, [...path]);
    }
    parsed = immichConfigSchema.safeParse(draft);
  }

  const config = parsed.success ? parsed.data : structuredClone(DEFAULT_CONFIG);

  config.advanced ||= applied.some((path) =>
    ADVANCED_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}.`)),
  );

  return config;
};
