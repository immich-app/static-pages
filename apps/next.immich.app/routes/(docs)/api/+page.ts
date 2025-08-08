import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (() => {
  return redirect(307, '/introduction');
}) satisfies PageLoad;
