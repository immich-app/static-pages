import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildCompose, buildComposeFields } from './build';
import { DEFAULT_CONFIG, FIELDS, type ImmichConfig } from './config';
import { sourceRanges } from './highlight';

const page = readFileSync(new URL('../../routes/docker-compose-builder/+page.svelte', import.meta.url), 'utf8');

const markers = page
  .matchAll(/data-field="([^"]+)"/g)
  .map((match) => match[1])
  .toArray();

const families = page
  .matchAll(/data-field=\{`([a-z]+):\$\{/gi)
  .map((match) => match[1])
  .toArray();

const withOverrides = (config: ImmichConfig) => {
  config.storage.customFolders = true;
  config.storage.overrides.thumbs = '/mnt/fast/thumbs';
  config.storage.overrides.backups = '/mnt/slow/backups';
  config.storage.externalLibraries = [
    { path: '/mnt/media/photos', readOnly: true },
    { path: '  ', readOnly: true },
    { path: '/mnt/media/family', readOnly: false },
  ];
  return config;
};

const configs: [string, ImmichConfig][] = [
  ['defaults', DEFAULT_CONFIG],
  [
    'everything on',
    (() => {
      const config = withOverrides(structuredClone(DEFAULT_CONFIG));
      config.timezone = 'Europe/Amsterdam';
      config.port = 8080;
      config.rootless = { enabled: true, uid: 99, gid: 100 };
      config.containerNames = false;
      config.hwaccel = { transcoding: 'rkmpp', ml: 'openvino' };
      config.network = { external: true, name: 'proxy' };
      return config;
    })(),
  ],
  [
    'external services',
    (() => {
      const config = structuredClone(DEFAULT_CONFIG);
      config.database.external = true;
      config.database.externalUrl = 'postgresql://u:p@h:5432/immich';
      config.redis = { external: true, host: 'redis.example.com', port: 6380, password: 'pw' };
      return config;
    })(),
  ],
  [
    'named database volume',
    (() => {
      const config = structuredClone(DEFAULT_CONFIG);
      config.database.mount = { type: 'volume' };
      return config;
    })(),
  ],
];

const everything = configs[1][1];

describe('the field table, the builder and the page agree', () => {
  it('every marker in the page is a declared field', () => {
    const declared = new Set<string>(Object.keys(FIELDS));
    expect(markers.filter((field) => !declared.has(field))).toEqual([]);
    expect(families.toSorted()).toEqual(['library', 'override']);
  });

  it('every declared field is reported by the builder', () => {
    const reported = buildComposeFields(everything, 'v3');
    expect(Object.keys(FIELDS).filter((field) => !Object.hasOwn(reported, field))).toEqual([]);
  });

  it('every declared field is wired to a control in the page', () => {
    const used = new Set([...markers, 'externalLibraries', 'customFolders']);
    expect(Object.keys(FIELDS).filter((field) => !used.has(field))).toEqual([]);
  });

  it('advanced fields all name a config path to reset', () => {
    for (const [id, field] of Object.entries(FIELDS)) {
      if ('advanced' in field) {
        expect(field.config.length, id).toBeGreaterThan(0);
      }
    }
  });
});

describe('reported paths point at real output', () => {
  for (const [name, config] of configs) {
    it(`resolves every claimed path (${name})`, () => {
      const text = buildCompose(config, 'v3');
      const fields = buildComposeFields(config, 'v3');

      const dangling = Object.entries(fields).flatMap(([field, paths]) =>
        paths.filter((path) => sourceRanges(text, [path]).length === 0).map((path) => `${field} -> ${path.join('.')}`),
      );

      expect(dangling).toEqual([]);
    });
  }

  it('maps external library rows to their own mount, skipping blanks', () => {
    const text = buildCompose(everything, 'v3');
    const fields = buildComposeFields(everything, 'v3');
    const slice = (field: string) => sourceRanges(text, fields[field]).map(([start, end]) => text.slice(start, end));

    expect(slice('library:0')).toEqual(['/mnt/media/photos:/mnt/media/photos:ro']);
    expect(slice('library:2')).toEqual(['/mnt/media/family:/mnt/media/family']);
    expect(fields['library:1']).toBeUndefined();
    expect(slice('override:thumbs')).toEqual(['/mnt/fast/thumbs:/data/thumbs']);
    expect(slice('override:backups')).toEqual(['/mnt/slow/backups:/data/backups']);
  });
});
