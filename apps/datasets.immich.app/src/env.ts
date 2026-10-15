import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  PUBLIC_CF_TURNSTILE_SITE: { public: true, static: true },
  PUBLIC_DATASET_API_ENDPOINT: { public: true, static: true },
});
