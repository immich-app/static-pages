import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { StorageKey } from '$lib';

export const ssr = false;

export const load = (async ({ url }) => {
  const instanceUrl = url.searchParams.get('instanceUrl') || localStorage.getItem(StorageKey.INSTANCE_URL) || '';
  url.searchParams.delete('instanceUrl');

  const pathAndParams = url.pathname + '?' + url.searchParams.toString();
  const targetUrl = pathAndParams === '/' ? '' : pathAndParams;

  if (targetUrl && instanceUrl) {
    redirect(302, new URL(pathAndParams, instanceUrl));
  }

  return {
    instanceUrl,
    targetUrl,
  };
}) satisfies PageLoad;
