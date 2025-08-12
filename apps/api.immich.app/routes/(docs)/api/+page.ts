import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { ApiPage } from '$lib/utils/api';

export const load = (() => {
  return redirect(307, ApiPage.Introduction);
}) satisfies PageLoad;
