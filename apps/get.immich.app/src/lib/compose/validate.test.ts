import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from './types';
import { validate } from './validate';

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
    config.storage.uploadLocation = '   ';
    expect(validate(config).uploadLocation).toBeTruthy();
  });

  it('requires the external URL when external Postgres is on, not the data location', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.external = true;
    config.database.mount = { type: 'bind', location: '' };
    const errors = validate(config);
    expect(errors.externalUrl).toBeTruthy();
    expect(errors.databaseLocation).toBeUndefined();
  });

  it('requires a bundled database password, but not when external', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.password = '';
    expect(validate(config).databasePassword).toBeTruthy();

    config.database.external = true;
    config.database.externalUrl = 'postgresql://u:p@h:5432/immich';
    expect(validate(config).databasePassword).toBeUndefined();
  });

  it('rejects a Windows path for the database bind mount, but not for a volume', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.mount = { type: 'bind', location: 'C:\\immich\\postgres' };
    expect(validate(config).databaseLocation).toContain('Windows');

    config.database.mount = { type: 'volume' };
    expect(validate(config).databaseLocation).toBeUndefined();
  });

  it('requires the redis host only when external Redis is on', () => {
    expect(validate(DEFAULT_CONFIG).redisHost).toBeUndefined();
    const config = structuredClone(DEFAULT_CONFIG);
    config.redis.external = true;
    expect(validate(config).redisHost).toBeTruthy();
  });

  it('flags the database sharing or nesting under a media path', () => {
    const same = structuredClone(DEFAULT_CONFIG);
    same.storage.uploadLocation = '/mnt/data';
    same.database.mount = { type: 'bind', location: '/mnt/data' };
    expect(validate(same).uploadLocation).toBeTruthy();
    expect(validate(same).databaseLocation).toBeTruthy();

    const nested = structuredClone(DEFAULT_CONFIG);
    nested.storage.uploadLocation = '/mnt/data';
    nested.database.mount = { type: 'bind', location: '/mnt/data/postgres' };
    expect(validate(nested).databaseLocation).toContain('overlaps');

    const volume = structuredClone(DEFAULT_CONFIG);
    volume.storage.uploadLocation = '/mnt/data';
    volume.database.mount = { type: 'volume' };
    expect(validate(volume).uploadLocation).toBeUndefined();
  });

  it('ignores trailing slashes when comparing paths', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.storage.uploadLocation = '/mnt/data/';
    config.database.mount = { type: 'bind', location: '/mnt/data' };
    expect(validate(config).databaseLocation).toBeTruthy();
  });

  it('rejects an out-of-range external redis port but allows blank', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.redis.external = true;
    config.redis.host = 'redis.example.com';
    expect(validate(config).redisPort).toBeUndefined();
    config.redis.port = '99999';
    expect(validate(config).redisPort).toBeTruthy();
  });

  it('flags server mounts that point at the same host path', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.storage.uploadLocation = '/mnt/data';
    config.storage.customFolders = true;
    config.storage.overrides.thumbs = '/mnt/data';
    const errors = validate(config);
    expect(errors.uploadLocation).toBeTruthy();
    expect(errors.thumbs).toBeTruthy();
    expect(errors.profile).toBeUndefined();
  });
});
