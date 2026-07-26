import { FOLDER_OVERRIDES, type ImmichConfig, type StorageOverrides } from './types';

export type ValidationField =
  | 'port'
  | 'uploadLocation'
  | keyof StorageOverrides
  | 'databaseLocation'
  | 'databasePassword'
  | 'externalUrl'
  | 'redisHost'
  | 'redisPort';

export type ValidationErrors = Partial<Record<ValidationField, string>>;

type Mount = { field: ValidationField; path: string };

const normalizePath = (path: string) => path.trim().replace(/\/+$/, '');

const isPort = (value: string) => {
  const port = Number(value);
  return value.trim() !== '' && Number.isInteger(port) && port >= 1 && port <= 65_535;
};

function collectMounts(config: ImmichConfig): Mount[] {
  const mounts: Mount[] = [{ field: 'uploadLocation', path: config.storage.uploadLocation }];

  if (config.storage.customFolders) {
    for (const { key } of FOLDER_OVERRIDES) {
      mounts.push({ field: key, path: config.storage.overrides[key] });
    }
  }

  if (!config.database.external && config.database.mount.type === 'bind') {
    mounts.push({ field: 'databaseLocation', path: config.database.mount.location });
  }

  return mounts.map(({ field, path }) => ({ field, path: normalizePath(path) })).filter(({ path }) => path !== '');
}

function checkOverlaps(mounts: Mount[], errors: ValidationErrors) {
  for (const [index, mount] of mounts.entries()) {
    for (const other of mounts.slice(index + 1)) {
      if (mount.path === other.path) {
        errors[mount.field] = 'This path is already used by another mount.';
        errors[other.field] = 'This path is already used by another mount.';
      } else if (mount.path.startsWith(`${other.path}/`) || other.path.startsWith(`${mount.path}/`)) {
        errors[mount.field] = 'This path overlaps another mount.';
        errors[other.field] = 'This path overlaps another mount.';
      }
    }
  }
}

export function validate(config: ImmichConfig): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!isPort(config.port)) {
    errors.port = 'Enter a port between 1 and 65535.';
  }

  if (!config.storage.uploadLocation.trim()) {
    errors.uploadLocation = 'Upload location is required.';
  }

  if (config.database.external) {
    if (!config.database.externalUrl.trim()) {
      errors.externalUrl = 'A connection URL is required for external Postgres.';
    }
  } else {
    if (config.database.mount.type === 'bind') {
      const location = config.database.mount.location.trim();
      if (!location) {
        errors.databaseLocation = 'Database location is required.';
      } else if (/^[a-zA-Z]:[\\/]/.test(location)) {
        errors.databaseLocation = "The database can't be on a Windows drive, use a named volume instead.";
      }
    }
    if (!config.database.password.trim()) {
      errors.databasePassword = 'A database password is required.';
    }
  }

  if (config.redis.external) {
    if (!config.redis.host.trim()) {
      errors.redisHost = 'A host is required for external Redis.';
    }
    if (config.redis.port.trim() && !isPort(config.redis.port)) {
      errors.redisPort = 'Enter a port between 1 and 65535.';
    }
  }

  checkOverlaps(collectMounts(config), errors);

  return errors;
}
