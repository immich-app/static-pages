import type { BlogType } from '$lib';
import { asQueryString } from '@immich/ui';

export const Routes = {
  blog: (options?: { type?: BlogType }) => `/blog` + asQueryString(options),
};
