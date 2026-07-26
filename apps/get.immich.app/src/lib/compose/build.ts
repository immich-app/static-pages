import deepmerge from 'deepmerge';
import { stringify } from 'yaml';
import { ML_BACKENDS, TRANSCODE_BACKENDS } from './hwaccel';
import { IMAGES } from './images';
import { FOLDER_OVERRIDES, type ComposeObject, type ImmichConfig } from './types';

const ROOTLESS_HARDENING: ComposeObject = {
  user: '1000:1000',
  security_opt: ['no-new-privileges:true'],
  cap_drop: ['NET_RAW'],
};

const ROOTLESS_VOLUMES = new Map<string, string[]>([
  ['immich-machine-learning', ['./ml-model-cache:/cache', './ml-dotcache:/.cache', './ml-config:/.config']],
  ['redis', ['./redis:/data']],
]);

enum NamedVolume {
  ModelCache = 'model-cache',
  PostgresData = 'postgres-data',
}

const isPlainObject = (value: unknown): value is ComposeObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isEmpty = (value: unknown) =>
  (Array.isArray(value) && value.length === 0) || (isPlainObject(value) && Object.keys(value).length === 0);

function pruneEmpty(object: ComposeObject): ComposeObject {
  return Object.fromEntries(
    Object.entries(object)
      .map(([key, value]) => [key, isPlainObject(value) ? pruneEmpty(value) : value])
      .filter(([, value]) => !isEmpty(value)),
  );
}

export function buildComposeSpec(config: ImmichConfig): ComposeObject {
  const { rootless } = config;

  const serverEnvironment: Record<string, string> = {};
  const setEnv = (key: string, value: string, fallback = '') => {
    const trimmed = value.trim();
    if (trimmed !== '' && trimmed !== fallback) {
      serverEnvironment[key] = trimmed;
    }
  };

  setEnv('TZ', config.timezone);
  if (config.database.external) {
    setEnv('DB_URL', config.database.externalUrl);
  } else {
    setEnv('DB_PASSWORD', config.database.password, 'postgres');
  }
  if (config.redis.external) {
    setEnv('REDIS_HOSTNAME', config.redis.host);
    setEnv('REDIS_PORT', config.redis.port, '6379');
    setEnv('REDIS_PASSWORD', config.redis.password);
  }

  const backingServices: ComposeObject = {};

  if (!config.redis.external) {
    backingServices.redis = {
      container_name: 'immich_redis',
      image: IMAGES.redis,
      healthcheck: { test: 'redis-cli ping || exit 1' },
      restart: 'always',
    };
  }

  if (!config.database.external) {
    backingServices.database = {
      container_name: 'immich_postgres',
      image: IMAGES.database,
      environment: {
        POSTGRES_PASSWORD: config.database.password,
        POSTGRES_USER: config.database.username,
        POSTGRES_DB: config.database.databaseName,
        POSTGRES_INITDB_ARGS: '--data-checksums',
        DB_STORAGE_TYPE: config.database.storageType,
      },
      volumes: [
        `${config.database.mount.type === 'volume' ? NamedVolume.PostgresData : config.database.mount.location}:/var/lib/postgresql/data`,
      ],
      shm_size: '128mb',
      restart: 'always',
      healthcheck: { disable: false },
    };
  }

  const overrideMounts = config.storage.customFolders
    ? FOLDER_OVERRIDES.filter(({ key }) => config.storage.overrides[key].trim()).map(
        ({ key, subfolder }) => `${config.storage.overrides[key].trim()}:/data/${subfolder}`,
      )
    : [];

  const services: ComposeObject = {
    'immich-server': deepmerge(
      {
        container_name: 'immich_server',
        image: IMAGES.server(config.version),
        volumes: [`${config.storage.uploadLocation}:/data`, ...overrideMounts, '/etc/localtime:/etc/localtime:ro'],
        environment: serverEnvironment,
        ports: [`${config.port.trim()}:2283`],
        depends_on: Object.keys(backingServices),
        restart: 'always',
        healthcheck: { disable: false },
      },
      TRANSCODE_BACKENDS[config.hwaccel.transcoding].fragment as ComposeObject,
    ),
    'immich-machine-learning': deepmerge(
      {
        container_name: 'immich_machine_learning',
        image: IMAGES.machineLearning(config.version + ML_BACKENDS[config.hwaccel.ml].tag),
        volumes: [`${NamedVolume.ModelCache}:/cache`],
        restart: 'always',
        healthcheck: { disable: false },
      },
      ML_BACKENDS[config.hwaccel.ml].fragment as ComposeObject,
    ),
    ...backingServices,
  };

  if (rootless) {
    for (const [name, service] of Object.entries(services)) {
      const hardened = deepmerge(service as ComposeObject, ROOTLESS_HARDENING);
      const rootlessVolumes = ROOTLESS_VOLUMES.get(name);
      if (rootlessVolumes) {
        hardened.volumes = rootlessVolumes;
      }
      services[name] = hardened;
    }
  }

  const mountSources = new Set(
    Object.values(services).flatMap((service) =>
      (((service as ComposeObject).volumes ?? []) as string[]).map((mount) => mount.split(':', 1)[0]),
    ),
  );
  const volumes = Object.fromEntries(
    Object.values(NamedVolume)
      .filter((name) => mountSources.has(name))
      .map((name) => [name, null]),
  );

  return pruneEmpty({ name: 'immich', services, volumes });
}

export function buildCompose(config: ImmichConfig): string {
  return stringify(buildComposeSpec(config), { lineWidth: 0, nullStr: '' });
}
