import { posts, typeToLabel, type BlogPost } from '#lib';
import type { SearchDoc } from '#lib/search.js';
import { getPostText } from '#lib/server/posts.js';
import { json } from '@sveltejs/kit';

export const prerender = true;

const fromBlogPost = (post: BlogPost): SearchDoc => {
  return {
    title: post.title,
    description: post.description,
    url: post.url,
    tags: [typeToLabel(post.type)],
    text: getPostText(post.url),
  };
};

export const GET = () => json(posts.map((post) => fromBlogPost(post)));
