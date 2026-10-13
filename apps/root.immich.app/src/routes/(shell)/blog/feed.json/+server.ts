import { feed } from '#lib/server/index.js';

export const prerender = true;

export const GET = () => new Response(feed.json1(), { headers: { 'Content-Type': 'application/json' } });
