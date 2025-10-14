import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async () => {
  redirect(307, '/');
}) satisfies PageLoad;
