import deepmerge from 'deepmerge';
import { stringify } from 'yaml';
import { ML_BACKENDS, TRANSCODE_BACKENDS } from './hwaccel';
import { IMAGES } from './images';
import { FIELDS, FOLDER_OVERRIDES, type ImmichConfig, type OutputContext } from './config';
import type { ComposeFile, ComposeService, FieldPaths, YamlPath } from './spec';

export const rootlessHardening = ({ uid, gid }: ImmichConfig['rootless']): ComposeService => ({
  user: `${uid ?? ''}:${gid ?? ''}`,
  security_opt: ['no-new-privileges:true'],
  cap_drop: ['NET_RAW'],
});

export const ROOTLESS_VOLUMES = new Map<string, string[]>([
  ['immich-machine-learning', ['./ml-model-cache:/cache']],
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
    environment.REDIS_PORT = unlessDefault(String(redis.port ?? ''), '6379');
    environment.REDIS_PASSWORD = redis.password.trim();
  }

  return environment;
};

const build = (config: ImmichConfig, version: string): { spec: ComposeFile; fields: FieldPaths } => {
  const { rootless, network } = config;
  const serverEnvironment = buildServerEnvironment(config);
  const containerName = (name: string) => (config.containerNames ? name : '');

  const externalNetwork = network.external ? network.name.trim() : '';

  const libraries = config.storage.externalLibraries
    .map(({ path, readOnly }, index) => ({ path: path.trim(), readOnly, index }))
    .filter(({ path }) => path);
  const libraryMounts = libraries.map(({ path, readOnly }) => `${path}:${path}${readOnly ? ':ro' : ''}`);
  const libraryIndices = libraries.map(({ index }) => index);

  const rootlessVolumes = (name: string) => (rootless.enabled ? ROOTLESS_VOLUMES.get(name) : undefined);

  const backingServices: Record<string, ComposeService> = {};

  if (!config.redis.external) {
    backingServices.redis = {
      container_name: containerName('immich_redis'),
      image: IMAGES.redis,
      healthcheck: { test: 'redis-cli ping || exit 1' },
      volumes: rootlessVolumes('redis') ?? [],
      restart: 'always',
    };
  }

  const databaseVolume: YamlPath[] = config.database.external
    ? []
    : [
        ['services', 'database', 'volumes', 0],
        ...(config.database.mount.type === 'volume' ? [['volumes', NamedVolume.PostgresData]] : []),
      ];

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

  const overrides = config.storage.customFolders
    ? FOLDER_OVERRIDES.filter(({ key }) => config.storage.overrides[key].trim())
    : [];
  const overrideMounts = overrides.map(
    ({ key, subfolder }) => `${config.storage.overrides[key].trim()}:/data/${subfolder}`,
  );
  const overrideKeys = overrides.map(({ key }) => key);

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
        ports: [`${config.port ?? ''}:2283`],
        depends_on: Object.keys(backingServices),
        networks: externalNetwork ? ['default', externalNetwork] : [],
        restart: 'always',
        healthcheck: { disable: false },
      },
      TRANSCODE_BACKENDS[config.hwaccel.transcoding].fragment,
    ),
    'immich-machine-learning': deepmerge<ComposeService>(
      {
        container_name: containerName('immich_machine_learning'),
        image: IMAGES.machineLearning(version + ML_BACKENDS[config.hwaccel.ml].tag),
        volumes: rootlessVolumes('immich-machine-learning') ?? [`${NamedVolume.ModelCache}:/cache`],
        restart: 'always',
        healthcheck: { disable: false },
      },
      ML_BACKENDS[config.hwaccel.ml].fragment,
    ),
    ...backingServices,
  };

  const rootlessPaths: YamlPath[] = [];
  const rootlessUserPaths: YamlPath[] = [];

  if (rootless.enabled) {
    for (const [name, service] of Object.entries(services)) {
      const hardening = rootlessHardening(rootless);
      services[name] = deepmerge(service, hardening);

      rootlessUserPaths.push(['services', name, 'user']);
      rootlessPaths.push(
        ...Object.keys(hardening).map((key) => ['services', name, key]),
        ...(rootlessVolumes(name) ? [['services', name, 'volumes']] : []),
      );
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

  const networks = externalNetwork ? { [externalNetwork]: { external: true } } : {};

  const spec: ComposeFile = { name: 'immich', services, volumes, networks };

  const context: OutputContext = {
    config,
    server: ['services', 'immich-server'],
    ml: ['services', 'immich-machine-learning'],
    services: Object.keys(services),
    env: (key) => {
      const value = serverEnvironment[key];
      return value === undefined || value === '' ? [] : [['services', 'immich-server', 'environment', key]];
    },
    bundledDatabase: !config.database.external,
    databaseVolume,
    network: externalNetwork
      ? [
          ['services', 'immich-server', 'networks'],
          ['networks', externalNetwork],
        ]
      : [],
    rootless: rootlessPaths,
    rootlessUser: rootlessUserPaths,
    overrides: overrideKeys.map((_, position) => ['services', 'immich-server', 'volumes', 1 + position]),
    libraries: libraryIndices.map((_, position) => [
      'services',
      'immich-server',
      'volumes',
      1 + overrideMounts.length + position,
    ]),
    fragment: (of) =>
      of === 'transcoding'
        ? Object.keys(TRANSCODE_BACKENDS[config.hwaccel.transcoding].fragment).map((key) => [
            'services',
            'immich-server',
            key,
          ])
        : Object.keys(ML_BACKENDS[config.hwaccel.ml].fragment).map((key) => [
            'services',
            'immich-machine-learning',
            key,
          ]),
  };

  const fields: FieldPaths = Object.fromEntries(
    Object.entries(FIELDS).map(([id, field]) => [id, 'output' in field ? field.output(context) : []]),
  );

  for (const [position, key] of overrideKeys.entries()) {
    fields[`override:${key}`] = [context.overrides[position]];
  }
  for (const [position, index] of libraryIndices.entries()) {
    fields[`library:${index}`] = [context.libraries[position]];
  }

  return { spec: pruneEmpty(spec), fields };
};

export const buildComposeSpec = (config: ImmichConfig, version: string): ComposeFile => build(config, version).spec;

export const buildComposeFields = (config: ImmichConfig, version: string): FieldPaths => build(config, version).fields;

export const buildCompose = (config: ImmichConfig, version: string): string =>
  stringify(buildComposeSpec(config, version), { lineWidth: 0, nullStr: '' });
