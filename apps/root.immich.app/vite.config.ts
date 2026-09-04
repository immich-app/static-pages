import {
  getHrefFromPath,
  svelteMarkdownVite,
  type ClientDoc,
  type ServerDoc,
} from '@immich/svelte-markdown-preprocess';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { z } from 'zod';
import { BlogType, type SerializedPost } from './src/lib/types.ts';

const PostSchema = z.object({
  id: z.uuid(),
  type: z.enum(BlogType),
  title: z.string().nonempty(),
  description: z.string().nonempty(),
  featured: z.boolean().optional(),
  authors: z.array(z.string().nonempty()).nonempty(),
  coverUrl: z.url().optional(),
  coverSrcset: z.string().optional(),
  coverWidth: z.number().optional(),
  coverHeight: z.number().optional(),
  coverAlt: z.string().optional(),
  coverAttribution: z.string().optional(),
  publishedAt: z.date(),
  modifiedAt: z.date().optional(),
});

const POST_PATH = /(?:^|\/)blog\/\((?<group>[^)]+)\)\/[^/]+\/\+page\.[^.]+$/;

const seen = new Map<string, string>();

export const onDoc = ({ path, attributes, headers }: ServerDoc): SerializedPost | ClientDoc => {
  const group = POST_PATH.exec(path)?.groups?.group;
  if (!group) {
    return { path, attributes, headers };
  }

  const parsed = PostSchema.safeParse({ ...attributes, type: group.replace(/s$/, '') });
  if (!parsed.success) {
    throw new Error(`${path} has invalid front matter:\n${z.prettifyError(parsed.error)}`);
  }

  const post = parsed.data;

  const duplicate = seen.get(post.id);
  if (duplicate && duplicate !== path) {
    throw new Error(
      `Detected a duplicate blog ID! ${post.id} is used in ${path} and ${duplicate}. Hint: use pnpm uuid to generate a new uuid-v7`,
    );
  }

  seen.set(post.id, path);

  return {
    path,
    attributes,
    headers,
    url: getHrefFromPath(path),
    ...post,
    publishedAt: post.publishedAt.toISOString(),
    modifiedAt: post.modifiedAt?.toISOString(),
  };
};

export default defineConfig({
  plugins: [tailwindcss(), sveltekit(), svelteMarkdownVite({ onDoc })],
  server: {
    fs: {
      allow: ['../../common'],
    },
  },
  optimizeDeps: {
    exclude: ['@immich/ui', '@immich/svelte-markdown-preprocess'],
  },
  test: {
    expect: { requireAssertions: true },
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
  },
});
