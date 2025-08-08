import { getOpenApi } from '$lib/services/open-api';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ url, params, parent }) => {
  await parent();

  const { tags } = getOpenApi();

  const tag = tags.find((tag) => url.pathname.startsWith(tag.href));
  if (!tag) {
    return redirect(307, '/api');
  }

  const endpoint = tag.endpoints.find((endpoint) => endpoint.operationId === params.operationId);
  if (!endpoint) {
    return redirect(307, tag.href);
  }

  return {
    tag,
    endpoint,
  };
}) satisfies PageLoad;
