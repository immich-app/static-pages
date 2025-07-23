import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { StorageKey } from '$lib';

export const ssr = false;

export const load = (async ({ url }) => {
  if (url.searchParams.has('host') && url.searchParams.has('scheme')) {
    const host = url.searchParams.get('host');
    const scheme = url.searchParams.get('scheme');

    // we need search params without host and scheme
    url.searchParams.delete('host');
    url.searchParams.delete('scheme');
    const strippedParams = url.searchParams.toString();

    redirect(302, `${scheme}://${host}${url.pathname}?${strippedParams}`);
  }

  const instanceUrl = localStorage.getItem(StorageKey.INSTANCE_URL) || '';
  const pathAndParams = url.pathname + url.search;
  const targetUrl = pathAndParams === '/' ? '' : pathAndParams;

  if (targetUrl && instanceUrl) {
    redirect(302, new URL(pathAndParams, instanceUrl));
  }

  return {
    instanceUrl,
    targetUrl,
  };
}) satisfies PageLoad;
