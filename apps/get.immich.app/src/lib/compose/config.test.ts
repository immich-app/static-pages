import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, validate } from './config';

describe('validate', () => {
  it('passes on the default config', () => {
    expect(validate(DEFAULT_CONFIG)).toEqual({});
  });

  it('rejects a port that is empty or out of range', () => {
    for (const port of ['', '  ', 'abc', '0', '65536']) {
      expect(validate({ ...DEFAULT_CONFIG, port }).port).toBeTruthy();
    }
    expect(validate({ ...DEFAULT_CONFIG, port: '8080' }).port).toBeUndefined();
  });

  it('requires the upload location', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.storage.uploadLocation = ' '.repeat(3);
    expect(validate(config)['storage.uploadLocation']).toBeTruthy();
  });

  it('requires the external URL when external Postgres is on, not the data location', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.external = true;
    config.database.mount = { type: 'bind', location: '' };
    const errors = validate(config);
    expect(errors['database.externalUrl']).toBeTruthy();
    expect(errors['database.mount.location']).toBeUndefined();
  });

  it('requires a bundled database password, but not when external', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.password = '';
    expect(validate(config)['database.password']).toBeTruthy();

    config.database.external = true;
    config.database.externalUrl = 'postgresql://u:p@h:5432/immich';
    expect(validate(config)['database.password']).toBeUndefined();
  });

  it('rejects a Windows path for the database bind mount, but not for a volume', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.mount = { type: 'bind', location: String.raw`C:\immich\postgres` };
    expect(validate(config)['database.mount.location']).toContain('Windows');

    config.database.mount = { type: 'volume' };
    expect(validate(config)['database.mount.location']).toBeUndefined();
  });

  it('requires the redis host only when external Redis is on', () => {
    expect(validate(DEFAULT_CONFIG)['redis.host']).toBeUndefined();
    const config = structuredClone(DEFAULT_CONFIG);
    config.redis.external = true;
    expect(validate(config)['redis.host']).toBeTruthy();
  });

  it('flags the database sharing or nesting under a media path', () => {
    const same = structuredClone(DEFAULT_CONFIG);
    same.storage.uploadLocation = '/mnt/data';
    same.database.mount = { type: 'bind', location: '/mnt/data' };
    expect(validate(same)['storage.uploadLocation']).toBeTruthy();
    expect(validate(same)['database.mount.location']).toBeTruthy();

    const nested = structuredClone(DEFAULT_CONFIG);
    nested.storage.uploadLocation = '/mnt/data';
    nested.database.mount = { type: 'bind', location: '/mnt/data/postgres' };
    expect(validate(nested)['database.mount.location']).toContain('overlaps');

    const volume = structuredClone(DEFAULT_CONFIG);
    volume.storage.uploadLocation = '/mnt/data';
    volume.database.mount = { type: 'volume' };
    expect(validate(volume)['storage.uploadLocation']).toBeUndefined();
  });

  it('ignores trailing slashes when comparing paths', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.storage.uploadLocation = '/mnt/data/';
    config.database.mount = { type: 'bind', location: '/mnt/data' };
    expect(validate(config)['database.mount.location']).toBeTruthy();
  });

  it('rejects an out-of-range external redis port but allows blank', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.redis.external = true;
    config.redis.host = 'redis.example.com';
    expect(validate(config)['redis.port']).toBeUndefined();
    config.redis.port = '99999';
    expect(validate(config)['redis.port']).toBeTruthy();
  });

  it('checks the rootless uid and gid only while rootless is on', () => {
    const off = structuredClone(DEFAULT_CONFIG);
    off.rootless = { enabled: false, uid: '', gid: 'abc' };
    expect(validate(off)).toEqual({});

    const on = structuredClone(DEFAULT_CONFIG);
    on.rootless = { enabled: true, uid: '', gid: 'abc' };
    expect(validate(on)['rootless.uid']).toBeTruthy();
    expect(validate(on)['rootless.gid']).toBeTruthy();

    on.rootless = { enabled: true, uid: '99', gid: '100' };
    expect(validate(on)).toEqual({});
  });

  it('flags server mounts that point at the same host path', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.storage.uploadLocation = '/mnt/data';
    config.storage.customFolders = true;
    config.storage.overrides.thumbs = '/mnt/data';
    const errors = validate(config);
    expect(errors['storage.uploadLocation']).toBeTruthy();
    expect(errors['storage.overrides.thumbs']).toBeTruthy();
    expect(errors['storage.overrides.profile']).toBeUndefined();
  });
});
