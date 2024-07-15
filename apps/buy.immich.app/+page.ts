import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

enum ProductType {
  Server = 'immich-server',
  Inidividual = 'immich-client',
}

export const load = (async ({ url }) => {
  const productId = url.searchParams.get('productId') as ProductType;
  const instanceUrl = url.searchParams.get('instanceUrl') as string;
  const orderId = url.searchParams.get('orderId') as string;

  if (orderId && instanceUrl) {
    // http://10.1.15.216:5173/?instanceUrl=http%3A%2F%2F10.1.15.216%3A2283&orderId=c945fba0-088b-479b-b6af-0ec23d632108

    const successUrl = new URL(`/success`, url.href);
    successUrl.searchParams.append('instanceUrl', instanceUrl);
    successUrl.searchParams.append('orderId', orderId);

    redirect(308, successUrl);
  }

  return {
    productId,
    instanceUrl,
    orderId,
  };
}) satisfies PageLoad;
