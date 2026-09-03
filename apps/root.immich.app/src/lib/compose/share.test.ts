import { describe, expect, it } from 'vitest';
import { buildCompose } from './build';
import { DEFAULT_CONFIG, StorageType, type ImmichConfig } from './config';
import { decodeShare, encodeShare, randomPassword } from './share';

const VERSION = 'v3';

const roundTrip = (config: ImmichConfig) => decodeShare(encodeShare(config));

describe('encodeShare', () => {
  it('encodes nothing for a default config', () => {
    expect([...encodeShare(DEFAULT_CONFIG)]).toEqual([]);
  });

  it('encodes only what differs from the defaults, as readable paths', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.timezone = 'Europe/Amsterdam';
    config.port = 8080;
    config.hwaccel.ml = 'cuda';
    config.database.storageType = StorageType.HDD;

    expect(encodeShare(config).toString()).toBe(
      'timezone=Europe%2FAmsterdam&port=8080&hwaccel.ml=cuda&database.storageType=HDD',
    );
  });

  it('encodes a named database volume without the now-irrelevant bind location', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.mount = { type: 'volume' };
    expect(encodeShare(config).toString()).toBe('database.mount.type=volume');
  });

  it('encodes each external library with its read-only flag, skipping blanks', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.storage.externalLibraries = [
      { path: '/mnt/media/photos', readOnly: true },
      { path: ' '.repeat(3), readOnly: true },
      { path: '/mnt/media/family', readOnly: false },
    ];
    expect([...encodeShare(config)]).toEqual([
      ['storage.externalLibraries.0.path', '/mnt/media/photos'],
      ['storage.externalLibraries.0.readOnly', 'true'],
      ['storage.externalLibraries.1.path', '/mnt/media/family'],
      ['storage.externalLibraries.1.readOnly', 'false'],
    ]);
  });
});

describe('external libraries', () => {
  const libraries = (params: string) => decodeShare(new URLSearchParams(params)).storage.externalLibraries;

  it('round-trips paths and read-only flags', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.storage.externalLibraries = [
      { path: '/mnt/a', readOnly: true },
      { path: '/mnt/b', readOnly: false },
    ];
    expect(decodeShare(encodeShare(config)).storage.externalLibraries).toEqual(config.storage.externalLibraries);
  });

  it('reindexes so a dropped blank row leaves no gap', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.storage.externalLibraries = [
      { path: ' '.repeat(3), readOnly: true },
      { path: '/mnt/b', readOnly: false },
    ];
    expect(encodeShare(config).get('storage.externalLibraries.0.path')).toBe('/mnt/b');
    expect(encodeShare(config).has('storage.externalLibraries.1.path')).toBe(false);
  });

  it('keeps readOnly a boolean rather than the string "true"', () => {
    expect(libraries('storage.externalLibraries.0.path=/mnt/a&storage.externalLibraries.0.readOnly=true')).toEqual([
      { path: '/mnt/a', readOnly: true },
    ]);
  });

  it('discards a row missing its path without discarding the rest of the link', () => {
    const params = 'storage.externalLibraries.0.readOnly=true&port=8080&timezone=Europe/Amsterdam';
    const config = decodeShare(new URLSearchParams(params));
    expect(config.storage.externalLibraries).toEqual([]);
    expect(config.port).toBe(8080);
    expect(config.timezone).toBe('Europe/Amsterdam');
  });

  it('refuses an absurd index rather than allocating for it', () => {
    expect(libraries('storage.externalLibraries.99999.path=/mnt/a')).toEqual([]);
  });
});

describe('hostile input', () => {
  it('cannot reach Object.prototype through a crafted path', () => {
    for (const attack of ['__proto__.polluted=1', 'constructor.prototype.polluted=1', '__proto__[polluted]=1']) {
      expect(() => decodeShare(new URLSearchParams(attack))).not.toThrow();
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('rejects one bad field without discarding the rest of the link', () => {
    const config = decodeShare(new URLSearchParams('hwaccel.ml=nope&port=8080&timezone=Europe/Amsterdam'));
    expect(config.hwaccel.ml).toBe(DEFAULT_CONFIG.hwaccel.ml);
    expect(config.port).toBe(8080);
    expect(config.timezone).toBe('Europe/Amsterdam');
  });

  it('ignores a path that tunnels into a leaf', () => {
    expect(decodeShare(new URLSearchParams('database.password.nested=x')).database.password).toBe(
      DEFAULT_CONFIG.database.password,
    );
  });
});

describe('coercion off the query string', () => {
  const decode = (params: string) => decodeShare(new URLSearchParams(params));

  it('keeps a numeric-looking string a string', () => {
    expect(decode('network.external=true&network.name=123').network.name).toBe('123');
  });

  it('types a field whose default is undefined', () => {
    expect(decode('redis.port=6380').redis.port).toBe(6380);
  });

  it('refuses a non-numeric value for a numeric field', () => {
    expect(decode('port=abc').port).toBe(DEFAULT_CONFIG.port);
  });

  it('refuses a non-boolean value for a boolean field', () => {
    expect(decode('containerNames=yes').containerNames).toBe(DEFAULT_CONFIG.containerNames);
  });

  it('reads the builder view settings like any other field', () => {
    const config = decode('advanced=true&version.pinned=true&version.tag=v2.0.1');
    expect(config.advanced).toBe(true);
    expect(config.version).toEqual({ pinned: true, tag: 'v2.0.1' });
  });
});

describe('the database password', () => {
  it('is never put in the link, only the intent to have a custom one', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.password = 'hunter2';
    const params = encodeShare(config);

    expect(params.get('database.password')).toBe('random');
    expect(params.toString()).not.toContain('hunter2');
  });

  it('is re-randomized on the way in, never taken from the link', () => {
    const literal = decodeShare(new URLSearchParams('database.password=hunter2'));
    expect(literal.database.password).toBe(DEFAULT_CONFIG.database.password);

    const marked = decodeShare(new URLSearchParams('database.password=random'));
    expect(marked.database.password).not.toBe(DEFAULT_CONFIG.database.password);
    expect(marked.database.password).toHaveLength(24);

    const again = decodeShare(new URLSearchParams('database.password=random'));
    expect(again.database.password).not.toBe(marked.database.password);
  });

  it('generates from the intended alphabet', () => {
    expect(randomPassword()).toMatch(/^[A-Za-z0-9_-]{24}$/);
  });
});

describe('decodeShare', () => {
  it('ignores unknown parameters', () => {
    expect(decodeShare(new URLSearchParams('nope=1&database.nope=2'))).toEqual(DEFAULT_CONFIG);
  });

  it('ignores values the schema rejects, keeping the default', () => {
    const config = decodeShare(new URLSearchParams('hwaccel.ml=notabackend&port=abc&storage.uploadLocation='));
    expect(config.hwaccel.ml).toBe(DEFAULT_CONFIG.hwaccel.ml);
    expect(config.port).toBe(DEFAULT_CONFIG.port);
    expect(config.storage.uploadLocation).toBe(DEFAULT_CONFIG.storage.uploadLocation);
  });

  it('coerces numbers and booleans off the query string', () => {
    const config = decodeShare(new URLSearchParams('port=8080&redis.port=6380&containerNames=false'));
    expect(config.port).toBe(8080);
    expect(config.redis.port).toBe(6380);
    expect(config.containerNames).toBe(false);
  });

  it('turns on advanced mode when the link says so, or when it uses an advanced field', () => {
    expect(decodeShare(new URLSearchParams('timezone=Europe/Amsterdam')).advanced).toBe(false);
    expect(decodeShare(new URLSearchParams('advanced=true')).advanced).toBe(true);
    expect(decodeShare(new URLSearchParams('port=8080')).advanced).toBe(true);
    expect(decodeShare(new URLSearchParams('storage.externalLibraries=ro:/mnt/a')).advanced).toBe(true);
  });
});

describe('the advanced toggle', () => {
  it('travels even when no advanced field was changed', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.advanced = true;
    const params = encodeShare(config);
    expect(params.toString()).toBe('advanced=true');
    expect(decodeShare(params).advanced).toBe(true);
  });

  it('stays out of a basic link', () => {
    expect(encodeShare(DEFAULT_CONFIG).has('advanced')).toBe(false);
  });
});

describe('the version pin', () => {
  const encode = (pinned: boolean, tag: string) => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.version = { pinned, tag };
    return encodeShare(config);
  };

  it('is absent while rolling', () => {
    expect([...encode(false, '')]).toEqual([]);
    expect(decodeShare(new URLSearchParams('')).version).toEqual({ pinned: false, tag: '' });
  });

  it('carries the intent to pin, letting the tag autofill, when left untouched', () => {
    expect(encode(true, '').toString()).toBe('version.pinned=true');
    expect(decodeShare(new URLSearchParams('version.pinned=true')).version).toEqual({ pinned: true, tag: '' });
  });

  it('carries the literal tag once it has been edited', () => {
    expect(encode(true, 'v2.0.1').toString()).toBe('version.pinned=true&version.tag=v2.0.1');
  });

  it('carries any tag the version field itself would accept', () => {
    const tag = 'v3.0.0+build.1';
    expect(decodeShare(encode(true, tag)).version).toEqual({ pinned: true, tag });
  });
});

describe('a shared link rebuilds the same compose file', () => {
  const cases: [string, (config: ImmichConfig) => void][] = [
    ['defaults', () => {}],
    [
      'everything on',
      (config) => {
        config.advanced = true;
        config.timezone = 'Europe/Amsterdam';
        config.port = 8080;
        config.containerNames = false;
        config.rootless = { enabled: true, uid: 99, gid: 100 };
        config.hwaccel = { transcoding: 'rkmpp', ml: 'openvino' };
        config.storage.uploadLocation = '/mnt/photos';
        config.storage.customFolders = true;
        config.storage.overrides.thumbs = '/mnt/fast/thumbs';
        config.storage.externalLibraries = [{ path: '/mnt/media/photos', readOnly: true }];
        config.network = { external: true, name: 'proxy' };
      },
    ],
    [
      'unicode and mixed libraries',
      (config) => {
        config.advanced = true;
        config.storage.uploadLocation = '/mnt/média/photos';
        config.storage.externalLibraries = [
          { path: '/mnt/media/фото', readOnly: true },
          { path: '/mnt/b', readOnly: false },
        ];
      },
    ],
    [
      'external services',
      (config) => {
        config.advanced = true;
        config.database.external = true;
        config.database.externalUrl = 'postgresql://u:p@h:5432/immich';
        config.redis = { external: true, host: 'redis.example.com', port: 6380, password: 'pw' };
      },
    ],
    [
      'named database volume',
      (config) => {
        config.database.mount = { type: 'volume' };
        config.database.storageType = StorageType.HDD;
      },
    ],
  ];

  for (const [name, mutate] of cases) {
    it(name, () => {
      const config = structuredClone(DEFAULT_CONFIG);
      mutate(config);
      expect(roundTrip(config)).toEqual(config);
      expect(buildCompose(roundTrip(config), VERSION)).toBe(buildCompose(config, VERSION));
    });
  }

  it('survives a custom password by regenerating it, so only that field differs', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.database.password = 'hunter2';
    const shared = roundTrip(config);

    expect(shared.database.password).not.toBe('hunter2');
    expect({ ...shared.database, password: '' }).toEqual({ ...config.database, password: '' });
  });
});
