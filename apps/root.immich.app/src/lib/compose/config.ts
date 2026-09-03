import { z } from 'zod';
import type { YamlPath } from './spec';
import { ML_BACKENDS, TRANSCODE_BACKENDS, type MlAccel, type TranscodeAccel } from './hwaccel';

const databaseMountSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bind'), location: z.string() }),
  z.object({ type: z.literal('volume') }),
]);

export enum StorageType {
  SSD = 'SSD',
  HDD = 'HDD',
}

const storageOverridesSchema = z.object({
  thumbs: z.string(),
  encodedVideo: z.string(),
  profile: z.string(),
  backups: z.string(),
});

type StorageOverrides = z.infer<typeof storageOverridesSchema>;

const transcodeAccelSchema = z.custom<TranscodeAccel>(
  (value) => typeof value === 'string' && Object.hasOwn(TRANSCODE_BACKENDS, value),
);
const mlAccelSchema = z.custom<MlAccel>((value) => typeof value === 'string' && Object.hasOwn(ML_BACKENDS, value));

const PORT_MESSAGE = 'Enter a port between 1 and 65535.';

const isPort = (value?: number) => value !== undefined && Number.isSafeInteger(value) && value >= 1 && value <= 65_535;

const ID_MESSAGE = 'Enter a numeric ID.';

const isId = (value?: number) => value !== undefined && Number.isSafeInteger(value) && value >= 0;

// WSL exposes Windows drives as single letter mounts, e.g. /mnt/c.
const isWindowsPath = (path: string) => /^[a-zA-Z]:[\\/]/.test(path) || /^\/mnt\/[a-z](\/|$)/i.test(path);

const required = (message: string) => z.string().refine((value) => value.trim() !== '', message);

const externalLibrarySchema = z.object({ path: z.string(), readOnly: z.boolean() });

const immichConfigSchema = z.object({
  timezone: z.string(),
  rootless: z.object({
    enabled: z.boolean(),
    uid: z.number().optional(),
    gid: z.number().optional(),
  }),
  port: z.number().optional().refine(isPort, PORT_MESSAGE),
  containerNames: z.boolean(),
  hwaccel: z.object({
    transcoding: transcodeAccelSchema,
    ml: mlAccelSchema,
  }),
  machineLearning: z.object({
    external: z.boolean(),
  }),
  storage: z.object({
    uploadLocation: required('Upload location is required.'),
    customFolders: z.boolean(),
    overrides: storageOverridesSchema,
    externalLibraries: z.array(externalLibrarySchema),
  }),
  database: z.object({
    mount: databaseMountSchema,
    storageType: z.enum(StorageType),
    username: z.string(),
    password: z.string(),
    databaseName: z.string(),
    external: z.boolean(),
    externalUrl: z.string(),
  }),
  redis: z.object({
    external: z.boolean(),
    host: z.string(),
    port: z.number().optional(),
    password: z.string(),
  }),
  network: z.object({
    external: z.boolean(),
    name: z.string(),
  }),
});

export type ImmichConfig = z.infer<typeof immichConfigSchema>;

export type OutputContext = {
  config: ImmichConfig;
  server: YamlPath;
  ml: YamlPath;
  services: string[];
  env: (key: string) => YamlPath[];
  bundledDatabase: boolean;
  bundledMl: boolean;
  databaseVolume: YamlPath[];
  network: YamlPath[];
  rootless: YamlPath[];
  rootlessUser: YamlPath[];
  overrides: YamlPath[];
  libraries: YamlPath[];
  fragment: (of: 'transcoding' | 'ml') => YamlPath[];
};

type FieldSpec = {
  config: string[];
  advanced?: true;
  output?: (context: OutputContext) => YamlPath[];
};

const DATABASE = ['services', 'database'];

export const FIELDS = {
  version: {
    config: [],
    output: ({ server, ml, bundledMl }) => [[...server, 'image'], ...(bundledMl ? [[...ml, 'image']] : [])],
  },
  timezone: { config: ['timezone'], output: ({ env }) => env('TZ') },
  port: { config: ['port'], advanced: true, output: ({ server }) => [[...server, 'ports', 0]] },
  containerNames: {
    config: ['containerNames'],
    advanced: true,
    output: ({ config, services }) =>
      config.containerNames ? services.map((name) => ['services', name, 'container_name']) : [],
  },
  rootless: { config: ['rootless.enabled'], output: ({ rootless }) => rootless },
  rootlessUser: { config: ['rootless.uid', 'rootless.gid'], output: ({ rootlessUser }) => rootlessUser },
  uploadLocation: { config: ['storage.uploadLocation'], output: ({ server }) => [[...server, 'volumes', 0]] },
  customFolders: { config: ['storage.customFolders'], advanced: true, output: ({ overrides }) => overrides },
  externalLibraries: { config: ['storage.externalLibraries'], advanced: true, output: ({ libraries }) => libraries },
  transcoding: { config: ['hwaccel.transcoding'], output: ({ fragment }) => fragment('transcoding') },
  ml: {
    config: ['hwaccel.ml'],
    output: ({ ml, fragment, bundledMl }) => (bundledMl ? [[...ml, 'image'], ...fragment('ml')] : []),
  },
  mlExternal: {
    config: ['machineLearning.external'],
    advanced: true,
    output: ({ ml, bundledMl }) => (bundledMl ? [ml] : []),
  },
  databaseExternal: {
    config: ['database.external'],
    advanced: true,
    output: ({ bundledDatabase, env }) => (bundledDatabase ? [DATABASE] : env('DB_URL')),
  },
  databaseMount: { config: ['database.mount'], output: ({ databaseVolume }) => databaseVolume },
  databaseLocation: { config: ['database.mount.location'], output: ({ databaseVolume }) => databaseVolume },
  databaseStorageType: {
    config: ['database.storageType'],
    output: ({ bundledDatabase }) => (bundledDatabase ? [[...DATABASE, 'environment', 'DB_STORAGE_TYPE']] : []),
  },
  databasePassword: {
    config: ['database.password'],
    output: ({ bundledDatabase, env }) => [
      ...(bundledDatabase ? [[...DATABASE, 'environment', 'POSTGRES_PASSWORD']] : []),
      ...env('DB_PASSWORD'),
    ],
  },
  externalUrl: { config: ['database.externalUrl'], output: ({ env }) => env('DB_URL') },
  redisExternal: {
    config: ['redis.external'],
    advanced: true,
    output: ({ env, services }) =>
      services.includes('redis')
        ? [['services', 'redis']]
        : [...env('REDIS_HOSTNAME'), ...env('REDIS_PORT'), ...env('REDIS_PASSWORD')],
  },
  redisHost: { config: ['redis.host'], output: ({ env }) => env('REDIS_HOSTNAME') },
  redisPort: { config: ['redis.port'], output: ({ env }) => env('REDIS_PORT') },
  redisPassword: { config: ['redis.password'], output: ({ env }) => env('REDIS_PASSWORD') },
  networkExternal: { config: ['network.external'], advanced: true, output: ({ network }) => network },
  networkName: { config: ['network.name'], output: ({ network }) => network },
} satisfies Record<string, FieldSpec>;

export type FieldId = keyof typeof FIELDS;

const valueAt = (source: unknown, path: string[]): unknown => {
  let value = source;
  for (const key of path) {
    value = (value as Record<string, unknown> | undefined)?.[key];
  }
  return value;
};

const assignAt = (target: ImmichConfig, path: string, value: unknown) => {
  const keys = path.split('.');
  const parent = valueAt(target, keys.slice(0, -1)) as Record<string, unknown>;
  parent[keys.at(-1) as string] = value;
};

export const withoutAdvanced = (config: ImmichConfig): ImmichConfig => {
  const basic = structuredClone(config);

  for (const field of Object.values(FIELDS)) {
    if (!('advanced' in field)) {
      continue;
    }
    for (const path of field.config) {
      const fallback = valueAt(DEFAULT_CONFIG, path.split('.'));
      assignAt(basic, path, structuredClone(fallback));
    }
  }

  return basic;
};

export const FOLDER_OVERRIDES: { key: keyof StorageOverrides; label: string; subfolder: string }[] = [
  { key: 'thumbs', label: 'Thumbnails', subfolder: 'thumbs' },
  { key: 'encodedVideo', label: 'Encoded video', subfolder: 'encoded-video' },
  { key: 'profile', label: 'Profile', subfolder: 'profile' },
  { key: 'backups', label: 'Backups', subfolder: 'backups' },
];

export const DEFAULT_CONFIG: ImmichConfig = {
  timezone: '',
  rootless: {
    enabled: false,
    uid: 1000,
    gid: 1000,
  },
  port: 2283,
  containerNames: true,
  hwaccel: {
    transcoding: 'cpu',
    ml: 'cpu',
  },
  machineLearning: {
    external: false,
  },
  storage: {
    uploadLocation: './library',
    customFolders: false,
    overrides: {
      thumbs: '',
      encodedVideo: '',
      profile: '',
      backups: '',
    },
    externalLibraries: [],
  },
  database: {
    mount: { type: 'bind', location: './postgres' },
    storageType: StorageType.SSD,
    username: 'postgres',
    password: 'postgres',
    databaseName: 'immich',
    external: false,
    externalUrl: '',
  },
  redis: {
    external: false,
    host: '',
    port: undefined,
    password: '',
  },
  network: {
    external: false,
    name: '',
  },
};

type ValidationErrors = Record<string, string>;

const normalizePath = (path: string) => path.trim().replace(/\/+$/, '');

type Mount = { path: string[]; location: string };

const collectMounts = (config: ImmichConfig): Mount[] => {
  const mounts: Mount[] = [{ path: ['storage', 'uploadLocation'], location: config.storage.uploadLocation }];

  if (config.storage.customFolders) {
    for (const { key } of FOLDER_OVERRIDES) {
      mounts.push({ path: ['storage', 'overrides', key], location: config.storage.overrides[key] });
    }
  }

  for (const [index, { path }] of config.storage.externalLibraries.entries()) {
    mounts.push({ path: ['storage', 'externalLibraries', String(index), 'path'], location: path });
  }

  if (!config.database.external && config.database.mount.type === 'bind') {
    mounts.push({ path: ['database', 'mount', 'location'], location: config.database.mount.location });
  }

  return mounts
    .map(({ path, location }) => ({ path, location: normalizePath(location) }))
    .filter(({ location }) => location !== '');
};

const validationSchema = immichConfigSchema.superRefine((config, ctx) => {
  const fail = (path: string[], message: string) => ctx.addIssue({ code: 'custom', path, message });

  if (config.rootless.enabled) {
    if (!isId(config.rootless.uid)) {
      fail(['rootless', 'uid'], ID_MESSAGE);
    }
    if (!isId(config.rootless.gid)) {
      fail(['rootless', 'gid'], ID_MESSAGE);
    }
  }

  for (const [index, { path }] of config.storage.externalLibraries.entries()) {
    const location = path.trim();
    if (!location) {
      fail(['storage', 'externalLibraries', String(index), 'path'], 'A path is required.');
    } else if (!location.startsWith('/')) {
      fail(['storage', 'externalLibraries', String(index), 'path'], 'Enter an absolute path, e.g. /mnt/media/photos.');
    }
  }

  if (config.network.external && !config.network.name.trim()) {
    fail(['network', 'name'], 'A network name is required.');
  }

  if (config.database.external) {
    if (!config.database.externalUrl.trim()) {
      fail(['database', 'externalUrl'], 'A connection URL is required for external Postgres.');
    }
  } else {
    if (config.database.mount.type === 'bind') {
      const location = config.database.mount.location.trim();
      if (!location) {
        fail(['database', 'mount', 'location'], 'Database location is required.');
      } else if (isWindowsPath(location)) {
        fail(
          ['database', 'mount', 'location'],
          "The database can't be on a Windows drive or WSL mount, use a named volume instead.",
        );
      }
    }
    if (!config.database.password.trim()) {
      fail(['database', 'password'], 'A database password is required.');
    }
  }

  if (config.redis.external) {
    if (!config.redis.host.trim()) {
      fail(['redis', 'host'], 'A host is required for external Redis.');
    }
    if (config.redis.port !== undefined && !isPort(config.redis.port)) {
      fail(['redis', 'port'], PORT_MESSAGE);
    }
  }

  const mounts = collectMounts(config);
  for (const [index, mount] of mounts.entries()) {
    for (const other of mounts.slice(index + 1)) {
      const overlaps =
        mount.location.startsWith(`${other.location}/`) || other.location.startsWith(`${mount.location}/`);
      const message =
        mount.location === other.location
          ? 'This path is already used by another mount.'
          : overlaps
            ? 'This path overlaps another mount.'
            : undefined;
      if (message) {
        fail(mount.path, message);
        fail(other.path, message);
      }
    }
  }
});

export const validate = (config: ImmichConfig): ValidationErrors => {
  const result = validationSchema.safeParse(config);
  if (result.success) {
    return {};
  }

  const errors: ValidationErrors = {};
  for (const issue of result.error.issues) {
    errors[issue.path.join('.')] = issue.message;
  }
  return errors;
};
