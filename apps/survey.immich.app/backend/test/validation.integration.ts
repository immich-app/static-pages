import { describe, expect, it, beforeAll } from 'vitest';
import { authedRequest, createPublishedSurvey, getAdminCookie } from './helpers';

describe('Survey creation validation', () => {
  beforeAll(async () => {
    await getAdminCookie();
  });

  it('rejects empty title', async () => {
    const res = await authedRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: '' }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects whitespace-only title', async () => {
    const res = await authedRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: '   ' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('Survey publish validation', () => {
  beforeAll(async () => {
    await getAdminCookie();
  });

  it('rejects publishing without a slug', async () => {
    const surveyRes = await authedRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: 'No Slug Survey' }),
    });
    const { id } = (await surveyRes.json()) as { id: string };

    // Add a section with a question so slug is the only missing requirement
    const sectionRes = await authedRequest(`/api/surveys/${id}/sections`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Section' }),
    });
    const section = (await sectionRes.json()) as { id: string };

    await authedRequest(`/api/sections/${section.id}/questions`, {
      method: 'POST',
      body: JSON.stringify({ text: 'Q1', type: 'text' }),
    });

    const res = await authedRequest(`/api/surveys/${id}/publish`, { method: 'PUT' });
    expect(res.status).toBe(400);
  });

  it('rejects publishing with no sections', async () => {
    const surveyRes = await authedRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: 'No Sections Survey' }),
    });
    const { id } = (await surveyRes.json()) as { id: string };

    await authedRequest(`/api/surveys/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ slug: `no-sections-${Date.now()}` }),
    });

    const res = await authedRequest(`/api/surveys/${id}/publish`, { method: 'PUT' });
    expect(res.status).toBe(400);
  });

  it('rejects publishing when section has no questions', async () => {
    const surveyRes = await authedRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: 'No Questions Survey' }),
    });
    const { id } = (await surveyRes.json()) as { id: string };

    await authedRequest(`/api/surveys/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ slug: `no-questions-${Date.now()}` }),
    });

    await authedRequest(`/api/surveys/${id}/sections`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Empty Section' }),
    });

    const res = await authedRequest(`/api/surveys/${id}/publish`, { method: 'PUT' });
    expect(res.status).toBe(400);
  });
});

describe('Question creation validation', () => {
  let sectionId: string;

  beforeAll(async () => {
    await getAdminCookie();

    const surveyRes = await authedRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: 'Question Validation Survey' }),
    });
    const { id } = (await surveyRes.json()) as { id: string };

    const sectionRes = await authedRequest(`/api/surveys/${id}/sections`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Section' }),
    });
    const section = (await sectionRes.json()) as { id: string };
    sectionId = section.id;
  });

  it('rejects empty question text', async () => {
    const res = await authedRequest(`/api/sections/${sectionId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ text: '', type: 'text' }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects whitespace-only question text', async () => {
    const res = await authedRequest(`/api/sections/${sectionId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ text: '   ', type: 'text' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('Duplicate slug validation', () => {
  beforeAll(async () => {
    await getAdminCookie();
  });

  it('rejects duplicate slug', async () => {
    const slug = `dup-slug-${Date.now()}`;

    // Create and publish a survey with the slug
    await createPublishedSurvey({ slug });

    // Create a second survey and try to use the same slug
    const surveyRes = await authedRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: 'Duplicate Slug Survey' }),
    });
    const { id } = (await surveyRes.json()) as { id: string };

    const res = await authedRequest(`/api/surveys/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ slug }),
    });
    expect(res.status).toBe(409);
  });
});
