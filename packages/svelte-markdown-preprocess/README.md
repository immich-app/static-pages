# @immich/svelte-markdown-preprocess

Renders markdown as Svelte components, and serves the collected front matter and headings back to the
app through a virtual module.

The package has two halves, and they are used together:

| Export                     | Kind                | Configured in      |
| -------------------------- | ------------------- | ------------------ |
| `svelteMarkdownPreprocess` | Svelte preprocessor | `svelte.config.js` |
| `svelteMarkdownVite`       | Vite plugin         | `vite.config.ts`   |

The preprocessor turns each `.md` file into a Svelte component and wraps it in an optional layout. The Vite
plugin scans the same files and serves them as `virtual:docs`, so a layout is handed the parsed doc
for its own page and the app can list every doc without importing any markdown into the browser.

## Setup

Four changes are needed to start using them.

### 1. `svelte.config.js`

Register the preprocessor and tell SvelteKit that `.md` files are routes.

```js
import { svelteMarkdownPreprocess } from '@immich/svelte-markdown-preprocess';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [
    svelteMarkdownPreprocess({
      layouts: {
        default: '$lib/components/MarkdownPage.svelte',
      },
    }),
    vitePreprocess(),
  ],
};

export default config;
```

`layouts.default` is used for every markdown file. A file can pick another one with a `layout` key in
its front matter, matching a key in `layouts`.

### 2. `vite.config.ts`

```ts
import { svelteMarkdownVite } from '@immich/svelte-markdown-preprocess';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit(), svelteMarkdownVite()],
});
```

### 3. `src/app.d.ts`

Pull in the ambient declaration for `virtual:docs`.

```ts
/// <reference types="@immich/svelte-markdown-preprocess/virtual" />
```

### 4. The layout component

The preprocessor looks up the current page and passes it as a `doc` prop.

```svelte
<script lang="ts">
  import type { ClientDoc } from '@immich/svelte-markdown-preprocess';
  import type { Snippet } from 'svelte';

  type Props = {
    doc?: ClientDoc;
    children?: Snippet;
  };

  const { doc, children }: Props = $props();
</script>

<h1>{doc?.attributes.title}</h1>

{@render children?.()}
```

`doc` is optional because markdown outside of `src/routes` still gets a layout, but has no entry in
the collection.

## The virtual module

```ts
import { getDoc, getDocs } from 'virtual:docs';

const all = getDocs();
const one = getDoc('(shell)/blog/(posts)/sync-v2/+page.md');
```

`getDoc` takes the doc's `path` - the file's location relative to `src/routes`, layout groups
included. Both are generic over the doc type, so pass yours to get it back:

```ts
const posts = getDocs<BlogPost>();
```

Every doc is at least a `ClientDoc`:

```ts
type ClientDoc = {
  path: string;
  attributes: FrontMatterAttributes; // parsed front matter
  headers: DocHeader[]; // level 2 and 3 headings, ids matching the rendered anchors
};
```

Markdown bodies are never serialized into the module, so no post content reaches the browser.

## Validating and reshaping docs

`onDoc` runs at build time for each file and decides what ships. It receives a `ServerDoc`, which is a
`ClientDoc` plus the markdown `body`. Throwing fails the build, and returning `undefined` leaves the
doc out of the collection.

```ts
svelteMarkdownVite({
  onDoc: ({ path, attributes, headers }) => {
    const parsed = FrontMatterSchema.safeParse(attributes);
    if (!parsed.success) {
      throw new Error(`${path} has invalid front matter`);
    }

    return { path, attributes, headers, ...parsed.data };
  },
});
```

A doc may gain properties, but never lose the ones on `ClientDoc` - the return type is constrained to
`T extends ClientDoc`, and `getDoc` keys the collection on `path`.

## Options

`svelteMarkdownPreprocess(options)`

| Option       | Default           | Purpose                                        |
| ------------ | ----------------- | ---------------------------------------------- |
| `extensions` | `['.md', '.mdx']` | file extensions to treat as markdown           |
| `layouts`    | `{}`              | layout component per front matter `layout` key |

`svelteMarkdownVite(options)`

| Option       | Default           | Purpose                                     |
| ------------ | ----------------- | ------------------------------------------- |
| `extensions` | `['.md', '.mdx']` | file extensions to collect                  |
| `onDoc`      | strips `body`     | validate and reshape a doc, or leave it out |

The module id (`virtual:docs`) and the scanned directory (`src/routes`) are fixed, and exported as
`VIRTUAL_ID` and `DOCS_DIR`.

## Utilities

| Export                       | Purpose                                                       |
| ---------------------------- | ------------------------------------------------------------- |
| `getHeaders(body, levels?)`  | headings of a markdown body, with anchor ids                  |
| `getHrefFromPath(path)`      | route of a page, with layout groups removed                   |
| `getIdFromText(text)`        | anchor id used for a heading, so links match what is rendered |
| `isMarkdownPath(path, ext?)` | whether a path is markdown                                    |
| `parseFrontMatter(content)`  | `{ attributes, body }` of a markdown file                     |
| `markedText(markdown)`       | markdown rendered to plain text, for search indexes           |

## Development

Editing a markdown file invalidates `virtual:docs` and triggers a full reload, so headings and front
matter stay current without restarting the dev server.
