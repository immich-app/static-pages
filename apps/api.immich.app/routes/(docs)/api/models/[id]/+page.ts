import { getOpenApi } from '$lib/api/services/open-api';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ url, parent }) => {
  await parent();
  const { models } = getOpenApi();
  const model = models.find((model) => model.href === url.pathname);
  if (!model) {
    return redirect(307, '/models');
  }

  return {
    model,
  };
}) satisfies PageLoad;
