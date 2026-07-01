import { posts, typeToLabel, type BlogPost } from '$lib';
import type { SearchDoc } from '$lib/search';
import { markdownToText } from '$lib/server';
import { json } from '@sveltejs/kit';

export const prerender = true;

const fromBlogPost = (post: BlogPost): SearchDoc => {
  return {
    title: post.title,
    description: post.description,
    url: post.url,
    tags: [typeToLabel(post.type)],
    text: markdownToText(post.markdown),
  };
};

export const GET = async () => {
  return json(posts.map((post) => fromBlogPost(post)));
};
