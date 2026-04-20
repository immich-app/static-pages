import { describe, expect, it, beforeAll } from 'vitest';
import { request, authedRequest, getAdminCookie, createCookieForRole, createPublishedSurvey } from './helpers';

describe('Authorization - unauthenticated requests', () => {
  it('rejects unauthenticated GET /api/surveys with 401', async () => {
    const res = await request('/api/surveys');
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated POST /api/surveys with 401', async () => {
    const res = await request('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: 'Should Fail' }),
    });
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated GET /api/tags with 401', async () => {
    const res = await request('/api/tags');
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated POST /api/tags with 401', async () => {
    const res = await request('/api/tags', {
      method: 'POST',
      body: JSON.stringify({ name: 'Should Fail' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('Authorization - public routes', () => {
  it('allows unauthenticated GET /api/auth/me', async () => {
    const res = await request('/api/auth/me');
    expect(res.status).toBe(200);
  });

  it('allows unauthenticated GET /api/s/:slug (returns 404 for missing slug, not 401)', async () => {
    const res = await request('/api/s/nonexistent-slug');
    expect(res.status).not.toBe(401);
  });
});

describe('Authorization - viewer role', () => {
  let viewerCookie: string;

  beforeAll(async () => {
    viewerCookie = await createCookieForRole('viewer');
  });

  it('can GET /api/surveys', async () => {
    const res = await request('/api/surveys', { cookie: viewerCookie });
    expect(res.status).toBe(200);
  });

  it('can GET /api/tags', async () => {
    const res = await request('/api/tags', { cookie: viewerCookie });
    expect(res.status).toBe(200);
  });

  it('cannot POST /api/surveys (403)', async () => {
    const res = await request('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: 'Viewer Survey' }),
      cookie: viewerCookie,
    });
    expect(res.status).toBe(403);
  });

  it('cannot POST /api/tags (403)', async () => {
    const res = await request('/api/tags', {
      method: 'POST',
      body: JSON.stringify({ name: 'Viewer Tag' }),
      cookie: viewerCookie,
    });
    expect(res.status).toBe(403);
  });
});

describe('Authorization - editor role', () => {
  let editorCookie: string;
  let surveyId: string;
  let tagId: string;

  beforeAll(async () => {
    editorCookie = await createCookieForRole('editor');

    // Create a survey and tag as editor for delete tests
    const surveyRes = await request('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: `Editor Auth Test ${Date.now()}` }),
      cookie: editorCookie,
    });
    const survey = (await surveyRes.json()) as { id: string };
    surveyId = survey.id;

    const tagRes = await request('/api/tags', {
      method: 'POST',
      body: JSON.stringify({ name: `Editor Auth Tag ${Date.now()}` }),
      cookie: editorCookie,
    });
    const tag = (await tagRes.json()) as { id: string };
    tagId = tag.id;
  });

  it('can GET /api/surveys', async () => {
    const res = await request('/api/surveys', { cookie: editorCookie });
    expect(res.status).toBe(200);
  });

  it('can POST /api/surveys (201)', async () => {
    const res = await request('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: `Editor Create ${Date.now()}` }),
      cookie: editorCookie,
    });
    expect(res.status).toBe(201);
  });

  it('can POST /api/tags (201)', async () => {
    const res = await request('/api/tags', {
      method: 'POST',
      body: JSON.stringify({ name: `Editor Tag ${Date.now()}` }),
      cookie: editorCookie,
    });
    expect(res.status).toBe(201);
  });

  it('cannot DELETE /api/surveys/:id (403)', async () => {
    const res = await request(`/api/surveys/${surveyId}`, {
      method: 'DELETE',
      cookie: editorCookie,
    });
    expect(res.status).toBe(403);
  });

  it('cannot DELETE /api/tags/:id (403)', async () => {
    const res = await request(`/api/tags/${tagId}`, {
      method: 'DELETE',
      cookie: editorCookie,
    });
    expect(res.status).toBe(403);
  });
});

describe('Authorization - admin role', () => {
  let adminCookie: string;

  beforeAll(async () => {
    adminCookie = await createCookieForRole('admin');
  });

  it('can GET /api/surveys', async () => {
    const res = await request('/api/surveys', { cookie: adminCookie });
    expect(res.status).toBe(200);
  });

  it('can POST /api/surveys (201)', async () => {
    const res = await request('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: `Admin Create ${Date.now()}` }),
      cookie: adminCookie,
    });
    expect(res.status).toBe(201);
  });

  it('can DELETE /api/surveys/:id', async () => {
    const createRes = await request('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: `Admin Delete ${Date.now()}` }),
      cookie: adminCookie,
    });
    const { id } = (await createRes.json()) as { id: string };

    const res = await request(`/api/surveys/${id}`, {
      method: 'DELETE',
      cookie: adminCookie,
    });
    expect(res.status).toBe(204);
  });

  it('can POST /api/tags (201)', async () => {
    const res = await request('/api/tags', {
      method: 'POST',
      body: JSON.stringify({ name: `Admin Tag ${Date.now()}` }),
      cookie: adminCookie,
    });
    expect(res.status).toBe(201);
  });

  it('can DELETE /api/tags/:id', async () => {
    const createRes = await request('/api/tags', {
      method: 'POST',
      body: JSON.stringify({ name: `Admin Delete Tag ${Date.now()}` }),
      cookie: adminCookie,
    });
    const { id } = (await createRes.json()) as { id: string };

    const res = await request(`/api/tags/${id}`, {
      method: 'DELETE',
      cookie: adminCookie,
    });
    expect(res.status).toBe(204);
  });
});
