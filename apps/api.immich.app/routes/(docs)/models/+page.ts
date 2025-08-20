import type { PageLoad } from './$types';

export const load = (async ({ parent }) => {
  await parent();
}) satisfies PageLoad;
