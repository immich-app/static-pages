import { describe, expect, it } from 'vitest';
import { load } from './+layout.js';

type LoadEvent = Parameters<typeof load>[0];

const newEvent = (response: Response, href = 'https://visual.immich.app/') =>
  ({ fetch: async () => response, url: new URL(href) }) as unknown as LoadEvent;

describe('layout load', () => {
  it('returns the signed in user', async () => {
    const user = { id: 'user-1', email: 'approver@immich.app', name: 'Approver', role: 'approver' };

    const result = await load(newEvent(Response.json(user)));

    expect(result).toEqual({ user });
  });

  it('sends a signed out visitor to login and back to the same page', async () => {
    const event = newEvent(new Response(null, { status: 401 }), 'https://visual.immich.app/builds?page=2');

    await expect(load(event)).rejects.toMatchObject({
      status: 307,
      location: '/api/auth/login?returnTo=%2Fbuilds%3Fpage%3D2',
    });
  });

  it('fails when the user cannot be loaded', async () => {
    const event = newEvent(new Response(null, { status: 500 }));

    await expect(load(event)).rejects.toMatchObject({ status: 500 });
  });
});
