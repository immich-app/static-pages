import { error, redirect } from '@sveltejs/kit';
import type { UserResponseDto } from '../../backend/src/dtos/user.dto.js';
import type { LayoutLoad } from './$types.js';

export const ssr = false;

export const load = (async ({ fetch, url }) => {
  const response = await fetch('/api/users/me');
  if (response.status === 401) {
    redirect(307, `/api/auth/login?returnTo=${encodeURIComponent(url.pathname + url.search)}`);
  }

  if (!response.ok) {
    error(response.status, 'Unable to load the signed in user');
  }

  const user: UserResponseDto = await response.json();

  return { user };
}) satisfies LayoutLoad;
