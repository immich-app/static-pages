import { describe, expect, it } from 'vitest';
import { buildCompose } from './build';
import { DEFAULT_CONFIG } from './config';
import { highlightedLines, sourceRanges } from './highlight';

const text = (() => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.timezone = 'Europe/Amsterdam';
  return buildCompose(config, 'v3');
})();

const slice = (paths: Parameters<typeof sourceRanges>[1]) =>
  sourceRanges(text, paths).map(([start, end]) => text.slice(start, end));

describe('sourceRanges', () => {
  it('covers the whole key and value of a mapping', () => {
    expect(slice([['services', 'immich-server', 'container_name']])).toEqual(['container_name: immich_server']);
    expect(slice([['services', 'immich-server', 'environment', 'TZ']])).toEqual(['TZ: Europe/Amsterdam']);
  });

  it('covers a single sequence item', () => {
    expect(slice([['services', 'immich-server', 'ports', 0]])).toEqual(['2283:2283']);
    expect(slice([['services', 'immich-server', 'volumes', 0]])).toEqual(['./library:/data']);
  });

  it('resolves several paths at once, in order', () => {
    expect(
      slice([
        ['services', 'immich-server', 'container_name'],
        ['services', 'redis', 'container_name'],
        ['services', 'database', 'container_name'],
      ]),
    ).toEqual(['container_name: immich_server', 'container_name: immich_redis', 'container_name: immich_postgres']);
  });

  it('drops paths that are not present', () => {
    expect(
      slice([
        ['services', 'immich-server', 'nope'],
        ['services', 'nope', 'x'],
      ]),
    ).toEqual([]);
  });
});

describe('highlightedLines', () => {
  const lineAt = (index: number) => text.split('\n')[index];

  it('returns the index of a single line', () => {
    const lines = highlightedLines(text, [['services', 'immich-server', 'environment', 'TZ']]);
    expect(lines).toHaveLength(1);
    expect(lineAt(lines[0]).trim()).toBe('TZ: Europe/Amsterdam');
  });

  it('spans every line of a multi-line block', () => {
    const lines = highlightedLines(text, [['services', 'immich-server', 'volumes']]);
    expect(lines.length).toBeGreaterThan(1);
    expect(lineAt(lines[0]).trim()).toBe('volumes:');
    for (const index of lines.slice(1)) {
      expect(lineAt(index).trimStart().startsWith('-')).toBe(true);
    }
  });

  it('is empty when nothing matches', () => {
    expect(highlightedLines(text, [['services', 'immich-server', 'nope']])).toEqual([]);
    expect(highlightedLines(text, [])).toEqual([]);
  });
});
