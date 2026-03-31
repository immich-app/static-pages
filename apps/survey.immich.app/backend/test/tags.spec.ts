import { describe, expect, it, beforeAll } from 'vitest';
import { authedRequest, getAdminCookie, createPublishedSurvey } from './helpers';

describe('Tags', () => {
  beforeAll(async () => {
    await getAdminCookie();
  });

  it('creates a tag', async () => {
    const res = await authedRequest('/api/tags', {
      method: 'POST',
      body: JSON.stringify({ name: `Test Tag ${Date.now()}`, color: '#ff0000' }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: string; name: string; color: string };
    expect(data.name).toContain('Test Tag');
    expect(data.color).toBe('#ff0000');
  });

  it('lists tags', async () => {
    const res = await authedRequest('/api/tags');
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<{ name: string }>;
    expect(data.length).toBeGreaterThan(0);
  });

  it('updates a tag', async () => {
    const createRes = await authedRequest('/api/tags', {
      method: 'POST',
      body: JSON.stringify({ name: `To Update ${Date.now()}` }),
    });
    const { id } = (await createRes.json()) as { id: string };

    const res = await authedRequest(`/api/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: `Updated Tag ${Date.now()}` }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string };
    expect(data.name).toContain('Updated Tag');
  });

  it('deletes a tag', async () => {
    const createRes = await authedRequest('/api/tags', {
      method: 'POST',
      body: JSON.stringify({ name: `To Delete ${Date.now()}` }),
    });
    const { id } = (await createRes.json()) as { id: string };

    const res = await authedRequest(`/api/tags/${id}`, { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  it('assigns and retrieves tags for a survey', async () => {
    const { surveyId } = await createPublishedSurvey();

    const tagRes = await authedRequest('/api/tags', {
      method: 'POST',
      body: JSON.stringify({ name: `Survey Tag ${Date.now()}` }),
    });
    const tag = (await tagRes.json()) as { id: string };

    // Assign
    const assignRes = await authedRequest(`/api/surveys/${surveyId}/tags`, {
      method: 'PUT',
      body: JSON.stringify({ tagIds: [tag.id] }),
    });
    expect(assignRes.status).toBe(204);

    // Retrieve
    const getRes = await authedRequest(`/api/surveys/${surveyId}/tags`);
    expect(getRes.status).toBe(200);
    const tags = (await getRes.json()) as Array<{ id: string }>;
    expect(tags.length).toBe(1);
    expect(tags[0].id).toBe(tag.id);
  });
});
