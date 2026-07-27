import type { MlAccel, TranscodeAccel } from './hwaccel';

export type ComposeObject = Record<string, unknown>;

export type ComposeService = ComposeObject & { volumes?: string[] };

export type DatabaseMount = { type: 'bind'; location: string } | { type: 'volume' };

export enum StorageType {
  SSD = 'SSD',
  HDD = 'HDD',
}

export interface StorageOverrides {
  thumbs: string;
  encodedVideo: string;
  profile: string;
  backups: string;
}

export interface ImmichConfig {
  timezone: string;
  rootless: boolean;
  port: string;
  hwaccel: {
    transcoding: TranscodeAccel;
    ml: MlAccel;
  };
  storage: {
    uploadLocation: string;
    customFolders: boolean;
    overrides: StorageOverrides;
  };
  database: {
    mount: DatabaseMount;
    storageType: StorageType;
    username: string;
    password: string;
    databaseName: string;
    external: boolean;
    externalUrl: string;
  };
  redis: {
    external: boolean;
    host: string;
    port: string;
    password: string;
  };
}

const ADVANCED_RESETS: ((config: ImmichConfig) => void)[] = [
  (config) => (config.port = DEFAULT_CONFIG.port),
  (config) => (config.storage.customFolders = DEFAULT_CONFIG.storage.customFolders),
  (config) => (config.database.external = DEFAULT_CONFIG.database.external),
  (config) => (config.redis.external = DEFAULT_CONFIG.redis.external),
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
  rootless: false,
  port: '2283',
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
};
