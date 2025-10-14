import { feed } from '$lib/server';

export const prerender = true;

export const GET = () => new Response(feed.json1(), { headers: { 'Content-Type': 'application/json' } });
