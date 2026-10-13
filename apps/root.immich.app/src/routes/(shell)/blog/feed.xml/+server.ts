import { feed } from '#lib/server/index.js';

export const prerender = true;

export const GET = () => new Response(feed.rss2(), { headers: { 'Content-Type': 'application/rss+xml' } });
