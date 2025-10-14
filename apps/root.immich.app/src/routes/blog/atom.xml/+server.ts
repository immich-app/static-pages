import { feed } from '$lib/server';

export const prerender = true;

export const GET = () => new Response(feed.atom1(), { headers: { 'Content-Type': 'application/atom+xml' } });
