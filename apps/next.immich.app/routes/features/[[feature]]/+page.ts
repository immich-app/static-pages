import { features } from '$lib/utilities';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  const feature = features.find((feature) => feature.href === url.pathname);

  return {
    feature,
  };
}) satisfies PageLoad;
