import type { PageLoad } from './$types';

export const ssr = false;

enum ProductType {
  Server = 'immich-server',
  Inidividual = 'immich-client',
}

enum PageParams {
  ProductId = 'productId',
  InstanceUrl = 'instanceUrl',
}

export const load = (async ({ url }) => {
  const productId = url.searchParams.get(PageParams.ProductId) as ProductType;
  const instanceUrl = url.searchParams.get(PageParams.InstanceUrl) as string;

  return {
    productId,
    instanceUrl,
  };
}) satisfies PageLoad;
