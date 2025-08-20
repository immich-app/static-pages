import { getOpenApi } from '$lib/api/services/open-api';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { ApiPage } from '$lib/utils/api';

export const load = (async ({ params, parent }) => {
  await parent();

  const { tags } = getOpenApi();

  const tag = tags.find((tag) => tag.href === `${ApiPage.Endpoints}/${params.tag}`);
  if (!tag) {
    return redirect(307, ApiPage.Endpoints);
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
