import type { PageLoad } from './$types';

export const ssr = false;

enum ProductType {
  Server = 'immich-server',
  Inidividual = 'immich-client',
}

export const load = (async ({ url }) => {
  const productId = url.searchParams.get('productId') as ProductType;
  const instanceUrl = url.searchParams.get('instanceUrl') as string;

  return {
    productId,
    instanceUrl,
  };
}) satisfies PageLoad;
