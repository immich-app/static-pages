import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { StorageKey } from '$lib';

export const ssr = false;

export const load = (async ({ url }) => {
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
