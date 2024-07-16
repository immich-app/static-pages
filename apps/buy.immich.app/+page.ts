import { getRedirectUrl } from '$lib/utils/endpoints';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

enum ProductType {
  Server = 'immich-server',
  Inidividual = 'immich-client',
}

export const load = (({ url }) => {
  const productId = url.searchParams.get('productId') as ProductType;
  const instanceUrl = url.searchParams.get('instanceUrl') as string;

  if (productId && instanceUrl) {
    redirect(302, getRedirectUrl(productId, instanceUrl));
  }

  return {
    productId,
    instanceUrl,
  };
}) satisfies PageLoad;
