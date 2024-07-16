import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  const orderId = url.searchParams.get('orderId') as string;
  const instanceUrl = url.searchParams.get('instanceUrl') as string;

  return {
    orderId,
    instanceUrl,
  };
}) satisfies PageLoad;
