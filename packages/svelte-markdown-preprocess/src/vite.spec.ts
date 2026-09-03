import { describe, expect, test } from 'vitest';
import { getHeaders, getHrefFromPath, isMarkdownPath } from './vite.js';

describe('getHeaders', () => {
  test('keeps level two and three headings with anchors matching the rendered ids', () => {
    expect(getHeaders('# Title\n\n## Using `restic`\n\nText\n\n### Sub heading\n\n#### Deep\n')).toEqual([
      { id: 'using', text: 'Using restic', level: 2 },
      { id: 'sub-heading', text: 'Sub heading', level: 3 },
    ]);
  });

  test('collects the requested levels only', () => {
    expect(getHeaders('# One\n\n## Two\n\n### Three\n', [1, 3])).toEqual([
      { id: 'one', text: 'One', level: 1 },
      { id: 'three', text: 'Three', level: 3 },
    ]);
  });

  test('ignores headings inside fenced code blocks', () => {
    const body = ['## Config', '', '```bash', '# comment', '## not a heading', '```', '', '## Usage', ''].join('\n');

    expect(getHeaders(body)).toEqual([
      { id: 'config', text: 'Config', level: 2 },
      { id: 'usage', text: 'Usage', level: 2 },
    ]);
  });

  test('replaces emoji shortcodes in the text, but not in the anchor', () => {
    expect(getHeaders('## Bye bye interns! :wave:\n')).toEqual([
      { id: 'bye-bye-interns', text: 'Bye bye interns! \u{1F44B}', level: 2 },
    ]);
  });

  test('returns an empty list when there are no headings', () => {
    expect(getHeaders('Just a paragraph.\n')).toEqual([]);
  });
});

describe('getHrefFromPath', () => {
  test('drops layout groups', () => {
    expect(getHrefFromPath('(shell)/blog/(posts)/sync-v2/+page.md')).toBe('/blog/sync-v2');
  });

  test('handles a page without any groups', () => {
    expect(getHrefFromPath('getting-started/install/+page.md')).toBe('/getting-started/install');
  });

  test('handles the root page', () => {
    expect(getHrefFromPath('+page.md')).toBe('/');
  });

  test('normalizes windows separators', () => {
    expect(getHrefFromPath(String.raw`(shell)\blog\(posts)\sync-v2\+page.md`)).toBe('/blog/sync-v2');
  });
});

describe('isMarkdownPath', () => {
  test('accepts any markdown file, not just route pages', () => {
    expect(isMarkdownPath('(docs)/components/markdown/Example.md')).toBe(true);
    expect(isMarkdownPath('(shell)/blog/(posts)/sync-v2/+page.md')).toBe(true);
  });

  test('rejects other extensions', () => {
    expect(isMarkdownPath('routes/+page.svelte')).toBe(false);
  });

  test('honors custom extensions', () => {
    expect(isMarkdownPath('notes/a.markdown', ['.markdown'])).toBe(true);
    expect(isMarkdownPath('notes/a.md', ['.markdown'])).toBe(false);
  });
});
