import fm from 'front-matter';
import { Marked } from 'marked';
import type { PreprocessorGroup } from 'svelte/compiler';
import { markedSvelte } from './marked-svelte.js';

type MaybePromise<T> = Promise<T> | T;

export type FileWithContent = { filename: string; content: string };
export type FileWithFrontMatter = { filename: string; attributes: FrontMatterAttributes; body: string };
export type FileWithScriptBody = FileWithFrontMatter & { scriptBody: string };
export type FileWithMarkup = FileWithScriptBody & { markup: string };
export type FileWithLayout = FileWithMarkup & { layout?: string };
export type FileWithSvelte = FileWithLayout & { svelte: string };

export type FrontMatterAttributes = {
  layout?: string;
  [key: string]: unknown;
};

export type SvelteMarkdownPreprocessLayouts = {
  _?: string;
  default?: string;
  [key: string]: string | undefined;
};

const SCRIPT_BODY_REGEX = /<script.*>(?<body>(.|\n)*?)<\/script>/;

export type SvelteMarkdownPreprocessOptions = {
  /** defaults to `['.md', '.mdx']` */
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
      .then((file) => this.parseLayout(file))
      .then((file) => this.parseSvelte(file))
      .then((file) => ({ code: file.svelte }));
  }

  matches(file: FileWithContent): boolean {
    return this.#extensions.some((extension) => file.filename.endsWith(extension));
  }

  parseFrontMatter({ filename, content }: FileWithContent): MaybePromise<FileWithFrontMatter> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { attributes, body } = fm(content) as { attributes: FrontMatterAttributes; body: string };
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

  parseLayout(file: FileWithMarkup): MaybePromise<FileWithLayout> {
    const layoutKey = file.attributes.layout;
    const layout = layoutKey ? this.#layouts[layoutKey] : (this.#layouts.default ?? this.#layouts._);
    return { ...file, layout };
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
    ];
  }

  scriptExtras(file: FileWithLayout): Array<string | undefined> {
    return file.layout ? [`  const attributes = ${JSON.stringify(file.attributes)};`] : [];
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
    return (file.layout ? [`<Layout {attributes}>`, file.markup, '</Layout>'] : [file.markup]).join('\n');
  }
}

export const svelteMarkdownPreprocess = (options?: SvelteMarkdownPreprocessOptions) => {
  const plugin = new SvelteMarkdownPreprocess(options);
  return {
    name: plugin.name,
    markup: (item) => plugin.markup(item),
  } satisfies PreprocessorGroup;
};
