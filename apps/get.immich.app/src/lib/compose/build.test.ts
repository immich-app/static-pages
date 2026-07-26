import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { buildCompose } from './build';
import { DEFAULT_CONFIG, StorageType, withoutAdvanced } from './types';

describe('buildCompose', () => {
  it('produces the four core services under name "immich"', () => {
    const spec = parse(buildCompose(DEFAULT_CONFIG));
    expect(spec.name).toBe('immich');
    expect(Object.keys(spec.services)).toEqual(['immich-server', 'immich-machine-learning', 'redis', 'database']);
  });

  it('inlines the version into both immich image tags', () => {
    const spec = parse(buildCompose({ ...DEFAULT_CONFIG, version: 'v3.0.3' }));
    expect(spec.services['immich-server'].image).toBe('ghcr.io/immich-app/immich-server:v3.0.3');
    expect(spec.services['immich-machine-learning'].image).toBe('ghcr.io/immich-app/immich-machine-learning:v3.0.3');
  });

  it('inlines storage and database locations as bind mounts', () => {
    const spec = parse(buildCompose(DEFAULT_CONFIG));
    expect(spec.services['immich-server'].volumes).toContain('./library:/data');
    expect(spec.services.database.volumes).toContain('./postgres:/var/lib/postgresql/data');
  });

  it('omits server environment on defaults and sets TZ only when provided', () => {
    expect(parse(buildCompose(DEFAULT_CONFIG)).services['immich-server'].environment).toBeUndefined();
    const withTz = parse(buildCompose({ ...DEFAULT_CONFIG, timezone: 'Europe/Amsterdam' }));
    expect(withTz.services['immich-server'].environment.TZ).toBe('Europe/Amsterdam');
  });

  it('adds only non-empty folder overrides, between the base and localtime mounts', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.storage.customFolders = true;
    config.storage.overrides.thumbs = '/mnt/fast/thumbs';
    config.storage.overrides.backups = '/mnt/slow/backups';
    const volumes = parse(buildCompose(config)).services['immich-server'].volumes;
    expect(volumes).toEqual([
      './library:/data',
      '/mnt/fast/thumbs:/data/thumbs',
      '/mnt/slow/backups:/data/backups',
      '/etc/localtime:/etc/localtime:ro',
    ]);
  });

  it('ignores overrides when the custom folders toggle is off', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.storage.overrides.thumbs = '/mnt/fast/thumbs';
    const volumes = parse(buildCompose(config)).services['immich-server'].volumes;
    expect(volumes).toEqual(['./library:/data', '/etc/localtime:/etc/localtime:ro']);
  });

  it('inlines the transcoding backend into immich-server, merging environment', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.timezone = 'Europe/Amsterdam';
    config.hwaccel.transcoding = 'vaapi-wsl';
    const server = parse(buildCompose(config)).services['immich-server'];
    expect(server.devices).toEqual(['/dev/dri:/dev/dri', '/dev/dxg:/dev/dxg']);
    expect(server.volumes).toContain('/usr/lib/wsl:/usr/lib/wsl');
    expect(server.environment).toEqual({ TZ: 'Europe/Amsterdam', LIBVA_DRIVER_NAME: 'd3d12' });
  });

  it('inlines the ML backend and suffixes the ML image tag', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.hwaccel.ml = 'cuda';
    const ml = parse(buildCompose({ ...config, version: 'v3.0.3' })).services['immich-machine-learning'];
    expect(ml.image).toBe('ghcr.io/immich-app/immich-machine-learning:v3.0.3-cuda');
    expect(ml.deploy.resources.reservations.devices[0].driver).toBe('nvidia');
  });

  it('adds no accel keys and no tag suffix on cpu (default)', () => {
    const spec = parse(buildCompose(DEFAULT_CONFIG));
    expect(spec.services['immich-server'].devices).toBeUndefined();
    expect(spec.services['immich-machine-learning'].image).toBe('ghcr.io/immich-app/immich-machine-learning:v3');
  });

  it('mirrors a custom bundled DB password to POSTGRES_PASSWORD and DB_PASSWORD, only when non-default', () => {
    const dflt = parse(buildCompose(DEFAULT_CONFIG));
    expect(dflt.services.database.environment.POSTGRES_PASSWORD).toBe('postgres');
    expect(dflt.services['immich-server'].environment).toBeUndefined();

    const config = structuredClone(DEFAULT_CONFIG);
    config.database.password = 'hunter2';
    const spec = parse(buildCompose(config));
    expect(spec.services.database.environment.POSTGRES_PASSWORD).toBe('hunter2');
    expect(spec.services['immich-server'].environment.DB_PASSWORD).toBe('hunter2');
    expect(spec.services['immich-server'].environment.DB_URL).toBeUndefined();
  });

  it('uses a named postgres-data volume when the db mount is a volume', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.mount = { type: 'volume' };
    const spec = parse(buildCompose(config));
    expect(spec.services.database.volumes).toEqual(['postgres-data:/var/lib/postgresql/data']);
    expect(spec.volumes['postgres-data']).toBeNull();
  });

  it('maps a custom host port onto container port 2283', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.port = '8080';
    expect(parse(buildCompose(config)).services['immich-server'].ports).toEqual(['8080:2283']);
  });

  it('states the database storage type explicitly', () => {
    expect(parse(buildCompose(DEFAULT_CONFIG)).services.database.environment.DB_STORAGE_TYPE).toBe('SSD');
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.storageType = StorageType.HDD;
    expect(parse(buildCompose(config)).services.database.environment.DB_STORAGE_TYPE).toBe('HDD');
  });

  it('produces the default output once advanced settings are stripped', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.port = '9999';
    config.storage.customFolders = true;
    config.storage.overrides.thumbs = '/mnt/fast/thumbs';
    config.database.external = true;
    config.database.externalUrl = 'postgresql://u:p@h:5432/immich';
    config.redis.external = true;
    config.redis.host = 'redis.example.com';

    expect(buildCompose(withoutAdvanced(config))).toBe(buildCompose(DEFAULT_CONFIG));
  });

  it('keeps null and false values while pruning empty containers', () => {
    const spec = parse(buildCompose(DEFAULT_CONFIG));
    expect(spec.volumes['model-cache']).toBeNull();
    expect(spec.services['immich-server'].healthcheck).toEqual({ disable: false });
  });

  it('declares a named volume only while a service still mounts it', () => {
    expect(parse(buildCompose(DEFAULT_CONFIG)).volumes).toEqual({ 'model-cache': null });

    const onVolume = structuredClone(DEFAULT_CONFIG);
    onVolume.database.mount = { type: 'volume' };
    expect(parse(buildCompose(onVolume)).volumes).toEqual({ 'model-cache': null, 'postgres-data': null });

    const external = structuredClone(DEFAULT_CONFIG);
    external.database.external = true;
    external.database.mount = { type: 'volume' };
    expect(parse(buildCompose(external)).volumes).toEqual({ 'model-cache': null });
  });

  it('hardens every service and rewires cache/volumes in rootless mode', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.rootless = true;
    const spec = parse(buildCompose(config));
    for (const name of ['immich-server', 'immich-machine-learning', 'redis', 'database']) {
      expect(spec.services[name].user).toBe('1000:1000');
      expect(spec.services[name].security_opt).toEqual(['no-new-privileges:true']);
      expect(spec.services[name].cap_drop).toEqual(['NET_RAW']);
    }
    expect(spec.services['immich-machine-learning'].volumes).toEqual([
      './ml-model-cache:/cache',
      './ml-dotcache:/.cache',
      './ml-config:/.config',
    ]);
    expect(spec.services.redis.volumes).toEqual(['./redis:/data']);
    expect(spec.volumes).toBeUndefined();
  });

  it('external Postgres drops the db service, sets DB_URL, and trims depends_on', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.external = true;
    config.database.externalUrl = 'postgresql://immich:pw@db.example.com:5432/immich';
    const spec = parse(buildCompose(config));
    expect(spec.services.database).toBeUndefined();
    expect(spec.services['immich-server'].environment.DB_URL).toBe('postgresql://immich:pw@db.example.com:5432/immich');
    expect(spec.services['immich-server'].depends_on).toEqual(['redis']);
  });

  it('external Redis drops the redis service and sets non-default REDIS_ vars', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.redis.external = true;
    config.redis.host = 'redis.example.com';
    config.redis.port = '6380';
    config.redis.password = 'secret';
    const server = parse(buildCompose(config)).services['immich-server'];
    expect(parse(buildCompose(config)).services.redis).toBeUndefined();
    expect(server.environment).toMatchObject({
      REDIS_HOSTNAME: 'redis.example.com',
      REDIS_PORT: '6380',
      REDIS_PASSWORD: 'secret',
    });
    expect(server.depends_on).toEqual(['database']);
  });

  it('omits depends_on entirely when both backing services are external', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.external = true;
    config.redis.external = true;
    config.redis.host = 'redis.example.com';
    const server = parse(buildCompose(config)).services['immich-server'];
    expect(server.depends_on).toBeUndefined();
  });
});
