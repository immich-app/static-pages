import type { PageLoad } from './[id]/$types';

export const load = (async ({ parent }) => {
  await parent();
}) satisfies PageLoad;
