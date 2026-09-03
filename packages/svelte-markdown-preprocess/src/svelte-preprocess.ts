/* eslint-disable unicorn/prefer-await */
import { Marked } from 'marked';
import type { PreprocessorGroup } from 'svelte/compiler';
import { markedSvelte } from './markdown.js';
import { DOCS_DIR, VIRTUAL_ID } from './vite.js';
import { parseFrontMatter, type FrontMatterAttributes } from './utility.js';

type MaybePromise<T> = Promise<T> | T;

export type MarkdownImage = { name: string; path: string };

export type FileWithContent = { filename: string; content: string };
export type FileWithFrontMatter = { filename: string; attributes: FrontMatterAttributes; body: string };
export type FileWithScriptBody = FileWithFrontMatter & { scriptBody: string };
export type FileWithMarkup = FileWithScriptBody & { markup: string };
export type FileWithImages = FileWithMarkup & { images: MarkdownImage[] };
export type FileWithLayout = FileWithImages & { layout?: string; path?: string };
export type FileWithSvelte = FileWithLayout & { svelte: string };

export type SvelteMarkdownPreprocessLayouts = {
  _?: string;
  default?: string;
  [key: string]: string | undefined;
};

const SCRIPT_BODY_REGEX = /<script.*>(?<body>(.|\n)*?)<\/script>/;
const MARKDOWN_IMAGE_SRC_REGEX = /(<Markdown\.Image\b[^>]*?\bsrc=)"([^"]*)"/g;
const IMG_SRC_REGEX = /(<img\b[^>]*?\bsrc=)"([^"]*)"/g;

export type SvelteMarkdownPreprocessOptions = {
  /**
  defaults to `['.md', '.mdx']`
  */
  extensions?: string[];
  layouts?: SvelteMarkdownPreprocessLayouts;
};

export class SvelteMarkdownPreprocess {
  name = '@immich/svelte-markdown-preprocess';

  #extensions: string[];
  #layouts: SvelteMarkdownPreprocessLayouts;
  #md: Marked;

  constructor(options?: SvelteMarkdownPreprocessOptions) {
    this.#extensions = options?.extensions ?? ['.md', '.mdx'];
    this.#layouts = options?.layouts ?? {};
    this.#md = this.configure(new Marked());
  }

  configure(md: Marked) {
    return md.use(markedSvelte());
  }

  async markup({ filename, content }: { filename?: string; content: string }) {
    if (!filename) {
      return;
    }

    if (!this.matches({ filename, content })) {
      return;
    }

    return Promise.resolve({ filename, content })
      .then((file) => this.parseFrontMatter(file))
      .then((file) => this.parseScriptBody(file))
      .then((file) => this.parseMarkdown(file))
      .then((file) => this.parseImages(file))
      .then((file) => this.parseLayout(file))
      .then((file) => this.parseSvelte(file))
      .then((file) => ({ code: file.svelte }));
  }

  matches(file: FileWithContent): boolean {
    return this.#extensions.some((extension) => file.filename.endsWith(extension));
  }

  parseFrontMatter({ filename, content }: FileWithContent): MaybePromise<FileWithFrontMatter> {
    const { attributes, body } = parseFrontMatter(content);
    return { filename, body, attributes };
  }

  parseScriptBody(file: FileWithFrontMatter): MaybePromise<FileWithScriptBody> {
    let scriptBody = '';
    let body = file.body;
    const match = SCRIPT_BODY_REGEX.exec(body);
    const bodyGroup = match?.groups?.body;
    if (bodyGroup) {
      scriptBody = bodyGroup.trim();
      body = body.slice(Math.max(0, match.index + match[0].length)).trim();
    }

    return { ...file, body, scriptBody };
  }

  async parseMarkdown(file: FileWithScriptBody): Promise<FileWithMarkup> {
    const markup = await this.#md.parse(file.body);
    return { ...file, markup };
  }

  parseImages(file: FileWithMarkup): MaybePromise<FileWithImages> {
    const images: MarkdownImage[] = [];

    let markup = file.markup;

    for (const regex of [MARKDOWN_IMAGE_SRC_REGEX, IMG_SRC_REGEX]) {
      markup = markup.replaceAll(regex, (match, prefix: string, path: string) => {
        if (!path.startsWith('./') && !path.startsWith('../')) {
          return match;
        }

        let image = images.find((item) => item.path === path);
        if (!image) {
          image = { name: `__image_${images.length}`, path };
          images.push(image);
        }

        return `${prefix}{${image.name}}`;
      });
    }

    return { ...file, markup, images };
  }

  parseLayout(file: FileWithImages): MaybePromise<FileWithLayout> {
    const layoutKey = file.attributes.layout;
    const layout = layoutKey ? this.#layouts[layoutKey] : (this.#layouts.default ?? this.#layouts._);
    return { ...file, layout, path: this.parsePath(file.filename) };
  }

  parsePath(filename: string): string | undefined {
    const path = filename.replaceAll('\\', '/');
    const index = path.lastIndexOf(`/${DOCS_DIR}/`);
    if (index === -1) {
      return;
    }

    return path.slice(index + DOCS_DIR.length + 2);
  }

  parseSvelte(file: FileWithLayout): MaybePromise<FileWithSvelte> {
    const script = this.createSvelteScript(file);
    const template = this.createSvelteTemplate(file);
    const svelte = `${script}\n${template}`;
    return { ...file, svelte };
  }

  scriptImports(file: FileWithLayout): Array<string | undefined> {
    return [
      `  import { Markdown } from '@immich/ui';`,
      file.layout ? `  import Layout from '${file.layout}';` : undefined,
      this.hasDoc(file) ? `  import { getDoc } from '${VIRTUAL_ID}';` : undefined,
      ...file.images.map((image) => `  import ${image.name} from '${image.path}';`),
    ];
  }

  hasDoc(file: FileWithLayout): boolean {
    return !!(file.layout && file.path);
  }

  scriptExtras(file: FileWithLayout): Array<string | undefined> {
    return this.hasDoc(file) ? [`  const doc = getDoc('${file.path}');`] : [];
  }

  createSvelteScript(file: FileWithLayout): string {
    return [
      `<script>`,
      ...this.scriptImports(file).filter(Boolean),
      ...this.scriptExtras(file).filter(Boolean),
      file.scriptBody,
      `</script>`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  createSvelteTemplate(file: FileWithLayout): string {
    // eslint-disable-next-line unicorn/no-incorrect-template-string-interpolation
    const open = this.hasDoc(file) ? `<Layout {doc}>` : `<Layout>`;
    return (file.layout ? [open, file.markup, '</Layout>'] : [file.markup]).join('\n');
  }
}

export const svelteMarkdownPreprocess = (options?: SvelteMarkdownPreprocessOptions) => {
  const plugin = new SvelteMarkdownPreprocess(options);
  return {
    name: plugin.name,
    markup: (item) => plugin.markup(item),
  } satisfies PreprocessorGroup;
};
