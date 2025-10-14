import { mergeInstanceUrl, shouldRedirect, StorageKey } from '$lib';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

export const load = (async ({ url }) => {
  const instanceUrl = url.searchParams.get('instanceUrl') || localStorage.getItem(StorageKey.INSTANCE_URL) || '';
  url.searchParams.delete('instanceUrl');

  if (instanceUrl === '') {
    return { instanceUrl };
  }

  if (!URL.canParse(instanceUrl)) {
    console.error(`Invalid instance URL '${instanceUrl}'`);
    return { instanceUrl };
  }

  const targetUrl = mergeInstanceUrl(url, instanceUrl);

  if (shouldRedirect(url)) {
    redirect(302, targetUrl);
  }

  return { instanceUrl, targetUrl };
}) satisfies PageLoad;
