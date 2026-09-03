import { Marked, Parser, type Token, type Tokens } from 'marked';
import { emojify } from 'node-emoji';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { markedSvelte } from './markdown.js';
import { getIdFromText, parseFrontMatter, type FrontMatterAttributes } from './utility.js';

export type DocHeader = {
  id: string;
  text: string;
  level: number;
};

export type ClientDoc = {
  path: string;
  attributes: FrontMatterAttributes;
  headers: DocHeader[];
};

export type ServerDoc = ClientDoc & {
  body: string;
};

export type SvelteMarkdownViteOptions<T> = {
  /**
  defaults to `['.md', '.mdx']`
  */
  extensions?: string[];
  /**
  validate and reshape a single doc. return `undefined` to leave it out, and throw to fail the build.
  a doc may gain properties, but never lose the ones on `ClientDoc`
  */
  onDoc?: (doc: ServerDoc) => T | undefined;
};

export const VIRTUAL_ID = 'virtual:docs';

export const DOCS_DIR = 'src/routes';

const RESOLVED_ID = '\0' + VIRTUAL_ID;

const GROUP = /^\(.*\)$/;

const md = new Marked().use(markedSvelte());

const inlineText = (tokens: Token[]): string =>
  tokens
    .map((token) => {
      if ('tokens' in token && token.tokens) {
        return inlineText(token.tokens);
      }

      return 'text' in token ? emojify(token.text) : '';
    })
    .join('');

export const getHeaders = (body: string, levels: number[] = [2, 3]): DocHeader[] => {
  const headers: DocHeader[] = [];

  for (const token of md.lexer(body)) {
    if (token.type !== 'heading') {
      continue;
    }

    const { depth, tokens } = token as Tokens.Heading;
    if (!levels.includes(depth)) {
      continue;
    }

    headers.push({
      id: getIdFromText(Parser.parseInline(tokens, md.defaults)),
      text: inlineText(tokens),
      level: depth,
    });
  }

  return headers;
};

export const getHrefFromPath = (path: string) => {
  const segments = path
    .replaceAll('\\', '/')
    .split('/')
    .slice(0, -1)
    .filter((segment) => !GROUP.test(segment));

  return '/' + segments.join('/');
};

export const isMarkdownPath = (path: string, extensions: string[] = ['.md', '.mdx']) =>
  extensions.some((extension) => path.endsWith(extension));

const readDocs = (dir: string, extensions: string[]) =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .map((entry) => entry.replaceAll('\\', '/'))
    .filter((entry) => isMarkdownPath(entry, extensions))
    .toSorted();

const asDoc = (dir: string, path: string): ServerDoc => {
  const { attributes, body } = parseFrontMatter(readFileSync(join(dir, path), 'utf8'));

  return { path, attributes, headers: getHeaders(body), body };
};

const serialize = (value: unknown) =>
  JSON.stringify(value)
    .replaceAll('<', String.raw`\u003c`)
    .replaceAll('\u{2028}', String.raw`\u2028`)
    .replaceAll('\u{2029}', String.raw`\u2029`);

export const svelteMarkdownVite = <T extends ClientDoc = ClientDoc>(options?: SvelteMarkdownViteOptions<T>): Plugin => {
  const { extensions = ['.md', '.mdx'], onDoc = ({ body: _body, ...doc }: ServerDoc) => doc as T } = options ?? {};

  let root: string;

  return {
    name: '@immich/svelte-markdown-preprocess:docs',

    configResolved(config) {
      root = resolve(config.root, DOCS_DIR);
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) {
        return RESOLVED_ID;
      }
    },

    load(id) {
      if (id !== RESOLVED_ID) {
        return;
      }

      const docs = readDocs(root, extensions)
        .map((path) => onDoc(asDoc(root, path)))
        .filter((doc) => doc !== undefined);

      return [
        `const docs = ${serialize(docs)};`,
        `const pathMap = new Map(docs.map((doc) => [doc.path, doc]));`,
        `export const getDocs = () => docs;`,
        `export const getDoc = (ref) => pathMap.get(ref);`,
      ].join('\n');
    },

    configureServer(server) {
      server.watcher.on('all', (_event, file) => {
        if (!isMarkdownPath(file, extensions)) {
          return;
        }

        for (const environment of Object.values(server.environments)) {
          const module = environment.moduleGraph.getModuleById(RESOLVED_ID);
          if (module) {
            environment.moduleGraph.invalidateModule(module);
          }
        }

        server.ws.send({ type: 'full-reload' });
      });
    },
  };
};
