import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { buildCompose } from './build';
import { DEFAULT_CONFIG, StorageType, withoutAdvanced } from './config';

const VERSION = 'v3';

describe('buildCompose', () => {
  it('produces the four core services under name "immich"', () => {
    const spec = parse(buildCompose(DEFAULT_CONFIG, VERSION));
    expect(spec.name).toBe('immich');
    expect(Object.keys(spec.services)).toEqual(['immich-server', 'immich-machine-learning', 'redis', 'database']);
  });

  it('inlines the version into both immich image tags', () => {
    const spec = parse(buildCompose(DEFAULT_CONFIG, 'v3.0.3'));
    expect(spec.services['immich-server'].image).toBe('ghcr.io/immich-app/immich-server:v3.0.3');
    expect(spec.services['immich-machine-learning'].image).toBe('ghcr.io/immich-app/immich-machine-learning:v3.0.3');
  });

  it('inlines storage and database locations as bind mounts', () => {
    const spec = parse(buildCompose(DEFAULT_CONFIG, VERSION));
    expect(spec.services['immich-server'].volumes).toContain('./library:/data');
    expect(spec.services.database.volumes).toContain('./postgres:/var/lib/postgresql/data');
  });

  it('omits server environment on defaults and sets TZ only when provided', () => {
    expect(parse(buildCompose(DEFAULT_CONFIG, VERSION)).services['immich-server'].environment).toBeUndefined();
    const withTz = parse(buildCompose({ ...DEFAULT_CONFIG, timezone: 'Europe/Amsterdam' }, VERSION));
    expect(withTz.services['immich-server'].environment.TZ).toBe('Europe/Amsterdam');
  });

  it('adds only non-empty folder overrides, between the base and localtime mounts', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.storage.customFolders = true;
    config.storage.overrides.thumbs = '/mnt/fast/thumbs';
    config.storage.overrides.backups = '/mnt/slow/backups';
    const volumes = parse(buildCompose(config, VERSION)).services['immich-server'].volumes;
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
    const volumes = parse(buildCompose(config, VERSION)).services['immich-server'].volumes;
    expect(volumes).toEqual(['./library:/data', '/etc/localtime:/etc/localtime:ro']);
  });

  it('inlines the transcoding backend into immich-server, merging environment', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.timezone = 'Europe/Amsterdam';
    config.hwaccel.transcoding = 'vaapi-wsl';
    const server = parse(buildCompose(config, VERSION)).services['immich-server'];
    expect(server.devices).toEqual(['/dev/dri:/dev/dri', '/dev/dxg:/dev/dxg']);
    expect(server.environment).toEqual({ TZ: 'Europe/Amsterdam', LIBVA_DRIVER_NAME: 'd3d12' });
    expect(server.volumes).toEqual([
      `${DEFAULT_CONFIG.storage.uploadLocation}:/data`,
      '/etc/localtime:/etc/localtime:ro',
      '/usr/lib/wsl:/usr/lib/wsl',
    ]);
  });

  it('inlines the ML backend and suffixes the ML image tag', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.hwaccel.ml = 'cuda';
    const ml = parse(buildCompose(config, 'v3.0.3')).services['immich-machine-learning'];
    expect(ml.image).toBe('ghcr.io/immich-app/immich-machine-learning:v3.0.3-cuda');
    expect(ml.deploy.resources.reservations.devices[0].driver).toBe('nvidia');
  });

  it('adds no accel keys and no tag suffix on cpu (default)', () => {
    const spec = parse(buildCompose(DEFAULT_CONFIG, VERSION));
    expect(spec.services['immich-server'].devices).toBeUndefined();
    expect(spec.services['immich-machine-learning'].image).toBe('ghcr.io/immich-app/immich-machine-learning:v3');
  });

  it('mirrors a custom bundled DB password to POSTGRES_PASSWORD and DB_PASSWORD, only when non-default', () => {
    const dflt = parse(buildCompose(DEFAULT_CONFIG, VERSION));
    expect(dflt.services.database.environment.POSTGRES_PASSWORD).toBe('postgres');
    expect(dflt.services['immich-server'].environment).toBeUndefined();

    const config = structuredClone(DEFAULT_CONFIG);
    config.database.password = 'hunter2';
    const spec = parse(buildCompose(config, VERSION));
    expect(spec.services.database.environment.POSTGRES_PASSWORD).toBe('hunter2');
    expect(spec.services['immich-server'].environment.DB_PASSWORD).toBe('hunter2');
    expect(spec.services['immich-server'].environment.DB_URL).toBeUndefined();
  });

  it('uses a named postgres-data volume when the db mount is a volume', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.mount = { type: 'volume' };
    const spec = parse(buildCompose(config, VERSION));
    expect(spec.services.database.volumes).toEqual(['postgres-data:/var/lib/postgresql/data']);
    expect(spec.volumes['postgres-data']).toBeNull();
  });

  it('maps a custom host port onto container port 2283', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.port = 8080;
    expect(parse(buildCompose(config, VERSION)).services['immich-server'].ports).toEqual(['8080:2283']);
  });

  it('states the database storage type explicitly', () => {
    expect(parse(buildCompose(DEFAULT_CONFIG, VERSION)).services.database.environment.DB_STORAGE_TYPE).toBe('SSD');
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.storageType = StorageType.HDD;
    expect(parse(buildCompose(config, VERSION)).services.database.environment.DB_STORAGE_TYPE).toBe('HDD');
  });

  it('produces the default output once advanced settings are stripped', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.port = 9999;
    config.storage.customFolders = true;
    config.storage.overrides.thumbs = '/mnt/fast/thumbs';
    config.database.external = true;
    config.database.externalUrl = 'postgresql://u:p@h:5432/immich';
    config.redis.external = true;
    config.redis.host = 'redis.example.com';
    config.containerNames = false;
    config.storage.externalLibraries = [{ path: '/mnt/media/photos', readOnly: true }];
    config.network = { external: true, name: 'proxy' };

    expect(buildCompose(withoutAdvanced(config), VERSION)).toBe(buildCompose(DEFAULT_CONFIG, VERSION));
  });

  it('separates top-level keys and services with a blank line, but not keys within a service', () => {
    const text = buildCompose(DEFAULT_CONFIG, VERSION);
    expect(text).toContain('name: immich\n\nservices:\n');
    expect(text).toContain('\n\n  immich-machine-learning:\n');
    expect(text).toContain('\n\nvolumes:\n');
    expect(text).toContain('    container_name: immich_server\n    image:');
    expect(text.startsWith('\n')).toBe(false);
  });

  it('keeps null and false values while pruning empty containers', () => {
    const spec = parse(buildCompose(DEFAULT_CONFIG, VERSION));
    expect(spec.volumes['model-cache']).toBeNull();
    expect(spec.services['immich-server'].healthcheck).toEqual({ disable: false });
  });

  it('declares a named volume only while a service still mounts it', () => {
    expect(parse(buildCompose(DEFAULT_CONFIG, VERSION)).volumes).toEqual({ 'model-cache': null });

    const onVolume = structuredClone(DEFAULT_CONFIG);
    onVolume.database.mount = { type: 'volume' };
    expect(parse(buildCompose(onVolume, VERSION)).volumes).toEqual({ 'model-cache': null, 'postgres-data': null });

    const external = structuredClone(DEFAULT_CONFIG);
    external.database.external = true;
    external.database.mount = { type: 'volume' };
    expect(parse(buildCompose(external, VERSION)).volumes).toEqual({ 'model-cache': null });
  });

  it('hardens every service and rewires cache/volumes in rootless mode', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.rootless.enabled = true;
    const spec = parse(buildCompose(config, VERSION));
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

  it('omits container names when the toggle is off', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.containerNames = false;
    const spec = parse(buildCompose(config, VERSION));
    for (const name of ['immich-server', 'immich-machine-learning', 'redis', 'database']) {
      expect(spec.services[name].container_name).toBeUndefined();
    }
    expect(parse(buildCompose(DEFAULT_CONFIG, VERSION)).services['immich-server'].container_name).toBe('immich_server');
  });

  it('mounts external libraries at the same path, honouring read-only', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.storage.externalLibraries = [
      { path: '/mnt/media/photos', readOnly: true },
      { path: '/mnt/media/writable', readOnly: false },
      { path: ' '.repeat(3), readOnly: true },
    ];
    const volumes = parse(buildCompose(config, VERSION)).services['immich-server'].volumes;
    expect(volumes).toEqual([
      './library:/data',
      '/mnt/media/photos:/mnt/media/photos:ro',
      '/mnt/media/writable:/mnt/media/writable',
      '/etc/localtime:/etc/localtime:ro',
    ]);
  });

  it('attaches only the server to an external network, keeping the default one', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.network = { external: true, name: 'proxy' };
    const spec = parse(buildCompose(config, VERSION));
    expect(spec.services['immich-server'].networks).toEqual(['default', 'proxy']);
    expect(spec.services['immich-machine-learning'].networks).toBeUndefined();
    expect(spec.services.redis.networks).toBeUndefined();
    expect(spec.services.database.networks).toBeUndefined();
    expect(spec.networks).toEqual({ proxy: { external: true } });
  });

  it('adds no network keys when the external network is off', () => {
    const spec = parse(buildCompose(DEFAULT_CONFIG, VERSION));
    expect(spec.services['immich-server'].networks).toBeUndefined();
    expect(spec.networks).toBeUndefined();
  });

  it('keeps hardware acceleration mounts in rootless mode', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.hwaccel.ml = 'openvino';
    config.rootless = { enabled: true, uid: 1000, gid: 1000 };
    const spec = parse(buildCompose(config, VERSION));

    expect(spec.services['immich-machine-learning'].volumes).toEqual([
      './ml-model-cache:/cache',
      './ml-dotcache:/.cache',
      './ml-config:/.config',
      '/dev/bus/usb:/dev/bus/usb',
    ]);
    expect(spec.services.redis.volumes).toEqual(['./redis:/data']);
    // the named cache volume is no longer mounted, so it is not declared
    expect(spec.volumes).toBeUndefined();
  });

  it('applies a custom uid and gid to every service', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.rootless = { enabled: true, uid: 99, gid: 100 };
    const spec = parse(buildCompose(config, VERSION));
    for (const name of ['immich-server', 'immich-machine-learning', 'redis', 'database']) {
      expect(spec.services[name].user).toBe('99:100');
    }
  });

  it('external Postgres drops the db service, sets DB_URL, and trims depends_on', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.external = true;
    config.database.externalUrl = 'postgresql://immich:pw@db.example.com:5432/immich';
    const spec = parse(buildCompose(config, VERSION));
    expect(spec.services.database).toBeUndefined();
    expect(spec.services['immich-server'].environment.DB_URL).toBe('postgresql://immich:pw@db.example.com:5432/immich');
    expect(spec.services['immich-server'].depends_on).toEqual(['redis']);
  });

  it('external Redis drops the redis service and sets non-default REDIS_ vars', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.redis.external = true;
    config.redis.host = 'redis.example.com';
    config.redis.port = 6380;
    config.redis.password = 'secret';
    const server = parse(buildCompose(config, VERSION)).services['immich-server'];
    expect(parse(buildCompose(config, VERSION)).services.redis).toBeUndefined();
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
    const server = parse(buildCompose(config, VERSION)).services['immich-server'];
    expect(server.depends_on).toBeUndefined();
  });
});
