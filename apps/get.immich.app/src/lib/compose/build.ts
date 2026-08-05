import deepmerge from 'deepmerge';
import { stringify } from 'yaml';
import { ML_BACKENDS, TRANSCODE_BACKENDS } from './hwaccel';
import { IMAGES } from './images';
import { FOLDER_OVERRIDES, type ImmichConfig } from './config';
import type { ComposeFile, ComposeService } from './spec';

const rootlessHardening = ({ uid, gid }: ImmichConfig['rootless']): ComposeService => ({
  user: `${uid.trim()}:${gid.trim()}`,
  security_opt: ['no-new-privileges:true'],
  cap_drop: ['NET_RAW'],
});

const ROOTLESS_VOLUMES = new Map<string, string[]>([
  ['immich-machine-learning', ['./ml-model-cache:/cache', './ml-dotcache:/.cache', './ml-config:/.config']],
  ['redis', ['./redis:/data']],
]);

enum NamedVolume {
  ModelCache = 'model-cache',
  PostgresData = 'postgres-data',
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isEmpty = (value: unknown) =>
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (isPlainObject(value) && Object.keys(value).length === 0);

const pruneEmpty = <T extends object>(object: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(object)
      .map(([key, value]) => [key, isPlainObject(value) ? pruneEmpty(value) : value])
      .filter(([, value]) => !isEmpty(value)),
  ) as Partial<T>;

type ServiceVolume = NonNullable<ComposeService['volumes']>[number];

const mountSource = (mount: ServiceVolume) => (typeof mount === 'string' ? mount.split(':', 1)[0] : mount.source);

const unlessDefault = (value: string, fallback: string) => (value === fallback ? '' : value);

const buildServerEnvironment = ({ timezone, database, redis }: ImmichConfig) => {
  const environment: Record<string, string> = { TZ: timezone.trim() };

  if (database.external) {
    environment.DB_URL = database.externalUrl.trim();
  } else {
    environment.DB_PASSWORD = unlessDefault(database.password.trim(), 'postgres');
  }

  if (redis.external) {
    environment.REDIS_HOSTNAME = redis.host.trim();
    environment.REDIS_PORT = unlessDefault(redis.port.trim(), '6379');
    environment.REDIS_PASSWORD = redis.password.trim();
  }

  return environment;
};

export const buildComposeSpec = (config: ImmichConfig, version: string): ComposeFile => {
  const { rootless } = config;
  const serverEnvironment = buildServerEnvironment(config);
  const containerName = (name: string) => (config.containerNames ? name : '');

  const libraryMounts = config.storage.externalLibraries
    .filter(({ path }) => path.trim())
    .map(({ path, readOnly }) => `${path.trim()}:${path.trim()}${readOnly ? ':ro' : ''}`);

  const backingServices: Record<string, ComposeService> = {};

  if (!config.redis.external) {
    backingServices.redis = {
      container_name: containerName('immich_redis'),
      image: IMAGES.redis,
      healthcheck: { test: 'redis-cli ping || exit 1' },
      restart: 'always',
    };
  }

  if (!config.database.external) {
    backingServices.database = {
      container_name: containerName('immich_postgres'),
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

  const services: Record<string, ComposeService> = {
    'immich-server': deepmerge<ComposeService>(
      {
        container_name: containerName('immich_server'),
        image: IMAGES.server(version),
        volumes: [
          `${config.storage.uploadLocation}:/data`,
          ...overrideMounts,
          ...libraryMounts,
          '/etc/localtime:/etc/localtime:ro',
        ],
        environment: serverEnvironment,
        ports: [`${config.port.trim()}:2283`],
        depends_on: Object.keys(backingServices),
        restart: 'always',
        healthcheck: { disable: false },
      },
      TRANSCODE_BACKENDS[config.hwaccel.transcoding].fragment,
    ),
    'immich-machine-learning': deepmerge<ComposeService>(
      {
        container_name: containerName('immich_machine_learning'),
        image: IMAGES.machineLearning(version + ML_BACKENDS[config.hwaccel.ml].tag),
        volumes: [`${NamedVolume.ModelCache}:/cache`],
        restart: 'always',
        healthcheck: { disable: false },
      },
      ML_BACKENDS[config.hwaccel.ml].fragment,
    ),
    ...backingServices,
  };

  if (rootless.enabled) {
    for (const [name, service] of Object.entries(services)) {
      const hardened = deepmerge(service, rootlessHardening(rootless));
      const rootlessVolumes = ROOTLESS_VOLUMES.get(name);
      if (rootlessVolumes) {
        hardened.volumes = rootlessVolumes;
      }
      services[name] = hardened;
    }
  }

  const mountSources = new Set(
    Object.values(services).flatMap((service) => (service.volumes ?? []).map((mount) => mountSource(mount))),
  );
  const volumes = Object.fromEntries(
    Object.values(NamedVolume)
      .filter((name) => mountSources.has(name))
      .map((name) => [name, null]),
  );

  const spec: ComposeFile = { name: 'immich', services, volumes };

  return pruneEmpty(spec);
};

export const buildCompose = (config: ImmichConfig, version: string): string =>
  stringify(buildComposeSpec(config, version), { lineWidth: 0, nullStr: '' });
