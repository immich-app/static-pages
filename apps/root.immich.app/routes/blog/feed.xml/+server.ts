import { feed } from '$lib/server';

export const prerender = true;

export const GET = () => new Response(feed.rss2(), { headers: { 'Content-Type': 'application/rss+xml' } });
