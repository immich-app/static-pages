import { getHrefFromPath, markedText } from '@immich/svelte-markdown-preprocess';

const ROUTES = '../../routes/';

const files = import.meta.glob('../../routes/**/blog/**/+page.md', {
  query: '?raw',
  eager: true,
  import: 'default',
});

const textByUrl = new Map(
  Object.entries(files).map(([path, content]) => [getHrefFromPath(path.slice(ROUTES.length)), content]),
);

export const getPostText = (url: string) => {
  const markdown = textByUrl.get(url);
  if (markdown === undefined) {
    throw new Error(`Could not find the markdown for ${url}`);
  }

  return markedText(markdown);
};
