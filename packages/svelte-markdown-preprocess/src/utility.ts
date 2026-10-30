import fm from 'front-matter';
import GithubSlugger, { slug } from 'github-slugger';

export type FrontMatterAttributes = {
  layout?: string;
  [key: string]: unknown;
};

export const parseFrontMatter = (content: string) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  return fm(content) as { attributes: FrontMatterAttributes; body: string };
};

const cleanText = (text: string) =>
  text
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim();

export const getIdFromText = (text: string) => slug(cleanText(text));

export const createSlugger = () => {
  const slugger = new GithubSlugger();

  return {
    slug: (text: string) => slugger.slug(cleanText(text)),
    reset: () => slugger.reset(),
  };
};

export const escapeHtml = (text: string) => {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

export const escapeSvelteCode = (text: string) => {
  let escaped = text;

  for (const char of ['{', '}', '`']) {
    escaped = escaped.replaceAll(char, () => `\\${char}`);
  }

  return escaped;
};

export const createAttributes = (attributes: Record<string, string | boolean | number | null | undefined>) => {
  const results = Object.entries(attributes)
    .filter(([, value]) => {
      if (value === null || value === undefined) {
        return false;
      }

      return !(typeof value === 'string' && value === '');
    })
    .map(([key, value]) => {
      if (typeof value === 'number') {
        return `${key}={${value}}`;
      }

      if (typeof value === 'boolean') {
        // eslint-disable-next-line unicorn/no-incorrect-template-string-interpolation
        return value ? key : `${key}={false}`;
      }

      return `${key}="${String(value).replaceAll('"', '&quot;')}"`;
    });
  if (results.length === 0) {
    return '';
  }

  return ' ' + results.join(' ');
};
