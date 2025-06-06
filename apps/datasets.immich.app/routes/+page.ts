import { getCallbackUrl, ImmichLicense } from '$lib/utils/license';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (({ url }) => {
  const productId = url.searchParams.get('productId') as ImmichLicense;
  const instanceUrl = url.searchParams.get('instanceUrl') as string;

  if (productId && instanceUrl) {
    redirect(302, getCallbackUrl(productId, instanceUrl));
  }

  return {
    productId,
    instanceUrl,
  };
}) satisfies PageLoad;
