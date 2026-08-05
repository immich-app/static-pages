import { z } from 'zod';
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

const isPort = (value: string) => {
  const port = Number(value);
  return value.trim() !== '' && Number.isSafeInteger(port) && port >= 1 && port <= 65_535;
};

const ID_MESSAGE = 'Enter a numeric ID.';

const isId = (value: string) => {
  const id = Number(value);
  return value.trim() !== '' && Number.isSafeInteger(id) && id >= 0;
};

// WSL exposes Windows drives as single letter mounts, e.g. /mnt/c.
const isWindowsPath = (path: string) => /^[a-zA-Z]:[\\/]/.test(path) || /^\/mnt\/[a-z](\/|$)/i.test(path);

const required = (message: string) => z.string().refine((value) => value.trim() !== '', message);

const externalLibrarySchema = z.object({ path: z.string(), readOnly: z.boolean() });

const immichConfigSchema = z.object({
  timezone: z.string(),
  rootless: z.object({
    enabled: z.boolean(),
    uid: z.string(),
    gid: z.string(),
  }),
  port: z.string().refine(isPort, PORT_MESSAGE),
  containerNames: z.boolean(),
  hwaccel: z.object({
    transcoding: transcodeAccelSchema,
    ml: mlAccelSchema,
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
    port: z.string(),
    password: z.string(),
  }),
  network: z.object({
    external: z.boolean(),
    name: z.string(),
  }),
});

export type ImmichConfig = z.infer<typeof immichConfigSchema>;

const ADVANCED_RESETS: ((config: ImmichConfig) => void)[] = [
  (config) => (config.port = DEFAULT_CONFIG.port),
  (config) => (config.storage.customFolders = DEFAULT_CONFIG.storage.customFolders),
  (config) => (config.database.external = DEFAULT_CONFIG.database.external),
  (config) => (config.redis.external = DEFAULT_CONFIG.redis.external),
  (config) => (config.containerNames = DEFAULT_CONFIG.containerNames),
  (config) => (config.storage.externalLibraries = structuredClone(DEFAULT_CONFIG.storage.externalLibraries)),
  (config) => (config.network.external = DEFAULT_CONFIG.network.external),
];

export const withoutAdvanced = (config: ImmichConfig): ImmichConfig => {
  const basic = structuredClone(config);
  for (const reset of ADVANCED_RESETS) {
    reset(basic);
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
    uid: '1000',
    gid: '1000',
  },
  port: '2283',
  containerNames: true,
  hwaccel: {
    transcoding: 'cpu',
    ml: 'cpu',
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
    port: '',
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
    if (config.redis.port.trim() && !isPort(config.redis.port)) {
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
