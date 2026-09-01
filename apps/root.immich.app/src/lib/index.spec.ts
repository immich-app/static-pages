import { BlogType, posts } from '$lib';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const routes = fileURLToPath(new URL('../routes', import.meta.url));

const markdownPosts = readdirSync(routes, { recursive: true, encoding: 'utf8' })
  .map((entry) => entry.split('/'))
  .filter((parts) => parts.includes('blog') && parts.at(-1) === '+page.md')
  .map((parts) => ({ slug: parts.at(-2)!, type: parts.at(-3)!.slice(1, -2) }));

describe('posts', () => {
  test('scans every markdown post in the routes folder', () => {
    expect(markdownPosts.length).toBeGreaterThan(0);
    expect(posts).toHaveLength(markdownPosts.length);
  });

  test('derives the url from the post folder', () => {
    const urls = posts.map((post) => post.url).toSorted();
    expect(urls).toEqual(markdownPosts.map(({ slug }) => `/blog/${slug}`).toSorted());
  });

  test('derives the type from the group folder', () => {
    const typeByUrl = new Map(markdownPosts.map(({ slug, type }) => [`/blog/${slug}`, type]));
    for (const post of posts) {
      expect(post.type, post.url).toBe(typeByUrl.get(post.url));
      expect(Object.values(BlogType)).toContain(post.type);
    }
  });

  test('parses the front matter of every post', () => {
    for (const post of posts) {
      expect(post.id, post.url).toEqual(expect.any(String));
      expect(post.title, post.url).toEqual(expect.any(String));
      expect(post.description, post.url).toEqual(expect.any(String));
      expect(post.authors.length, post.url).toBeGreaterThan(0);
      expect(post.publishedAt.isValid, post.url).toBe(true);
      expect(post.markdown, post.url).toContain('---');
    }
  });

  test('sorts posts from newest to oldest', () => {
    const publishedAt = posts.map((post) => post.publishedAt.valueOf());
    expect(publishedAt).toEqual(publishedAt.toSorted((a, b) => b - a));
  });

  test('has a unique id per post', () => {
    const ids = new Set(posts.map((post) => post.id));
    expect(ids.size).toBe(posts.length);
  });
});
