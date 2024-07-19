import { PUBLIC_IMMICH_API_HOST } from '$env/static/public';
import type { Fetch } from '$lib';
import type { ImmichLicense } from '$lib/utils/license';

export type License = { type: ImmichLicense; licenseKey: string; activationKey: string };

export type ClaimSuccessResponseDto = {
  username: string;
  imageUrl: string;
  licenses: License[];
};

export type ClaimErrorResponseDto = {
  error: string;
};

export const getAuthorizeUrl = async () => {
  const response = await fetch(new URL('/oauth/authorize', PUBLIC_IMMICH_API_HOST).href);
  if (!response.ok) {
    return { error: 'Something went wrong' };
  }

  const { url } = await response.json();
  return { url: url + '&redirect_uri=' + encodeURIComponent(window.location.origin + '/claim/callback') };
};

export const callback = async (fetch: Fetch, url: string) => {
  const response = await fetch(new URL('/oauth/callback', PUBLIC_IMMICH_API_HOST).href, {
    method: 'POST',
    body: JSON.stringify({ url }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    return { error: 'Unable to login with GitHub' };
  }

  return { response: (await response.json()) as ClaimSuccessResponseDto };
};
