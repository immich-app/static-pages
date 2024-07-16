import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  const orderId = url.searchParams.get('orderId') as string;
  const instanceUrl = url.searchParams.get('instanceUrl') as string;

  if (!orderId) {
    redirect(302, '/');
  }

  return {
    orderId,
    instanceUrl,
  };
}) satisfies PageLoad;
