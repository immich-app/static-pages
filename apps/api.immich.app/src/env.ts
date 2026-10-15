import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({ PUBLIC_IMMICH_SPEC_URL: { public: true, static: true } });
