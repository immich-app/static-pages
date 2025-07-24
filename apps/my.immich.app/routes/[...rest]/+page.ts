import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { StorageKey } from '$lib';

export const ssr = false;

export const load = (async ({ url }) => {
  if (url.searchParams.has('instanceUrl')) {
    const instanceURL = url.searchParams.get('instanceUrl');

    // remove the instanceURL for the redirect
    url.searchParams.delete('instanceUrl');
    const strippedParams = url.searchParams.toString();

    redirect(302, `${instanceURL}${url.pathname}?${strippedParams}`);
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
