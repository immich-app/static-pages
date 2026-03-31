import { describe, expect, it, beforeAll } from 'vitest';
import { authedRequest, createPublishedSurvey, getAdminCookie } from './helpers';

describe('Survey CRUD', () => {
  beforeAll(async () => {
    await getAdminCookie();
  });

  it('creates a survey', async () => {
    const res = await authedRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Survey' }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: string; title: string; status: string };
    expect(data.title).toBe('Test Survey');
    expect(data.status).toBe('draft');
    expect(data.id).toBeTruthy();
  });

  it('lists surveys', async () => {
    const res = await authedRequest('/api/surveys');
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<{ id: string }>;
    expect(data.length).toBeGreaterThan(0);
  });

  it('gets survey by ID', async () => {
    const createRes = await authedRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: 'Get By ID Test' }),
    });
    const { id } = (await createRes.json()) as { id: string };

    const res = await authedRequest(`/api/surveys/${id}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { survey: { title: string }; sections: unknown[]; questions: unknown[] };
    expect(data.survey.title).toBe('Get By ID Test');
    expect(data.sections).toEqual([]);
    expect(data.questions).toEqual([]);
  });

  it('updates a survey', async () => {
    const createRes = await authedRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: 'Before Update' }),
    });
    const { id } = (await createRes.json()) as { id: string };

    const res = await authedRequest(`/api/surveys/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: 'After Update', slug: `test-update-${Date.now()}` }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { title: string; slug: string };
    expect(data.title).toBe('After Update');
    expect(data.slug).toContain('test-update');
  });

  it('deletes a survey', async () => {
    const createRes = await authedRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: 'To Delete' }),
    });
    const { id } = (await createRes.json()) as { id: string };

    const res = await authedRequest(`/api/surveys/${id}`, { method: 'DELETE' });
    expect(res.status).toBe(204);

    const getRes = await authedRequest(`/api/surveys/${id}`);
    expect(getRes.status).toBe(404);
  });

  it('publishes and unpublishes a survey', async () => {
    const { surveyId } = await createPublishedSurvey();

    // Unpublish
    const unpubRes = await authedRequest(`/api/surveys/${surveyId}/unpublish`, { method: 'PUT' });
    expect(unpubRes.status).toBe(200);
    const data = (await unpubRes.json()) as { status: string };
    expect(data.status).toBe('draft');
  });

  it('archives and unarchives a survey', async () => {
    const createRes = await authedRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: 'Archive Test' }),
    });
    const { id } = (await createRes.json()) as { id: string };

    const archiveRes = await authedRequest(`/api/surveys/${id}/archive`, { method: 'PUT' });
    expect(archiveRes.status).toBe(200);
    const archived = (await archiveRes.json()) as { archived_at: string | null };
    expect(archived.archived_at).toBeTruthy();

    const unarchiveRes = await authedRequest(`/api/surveys/${id}/unarchive`, { method: 'PUT' });
    expect(unarchiveRes.status).toBe(200);
    const unarchived = (await unarchiveRes.json()) as { archived_at: string | null };
    expect(unarchived.archived_at).toBeNull();
  });

  it('duplicates a survey', async () => {
    const { surveyId } = await createPublishedSurvey();

    const res = await authedRequest(`/api/surveys/${surveyId}/duplicate`, { method: 'POST' });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { survey: { id: string; title: string }; sections: unknown[]; questions: unknown[] };
    expect(data.survey.id).not.toBe(surveyId);
    expect(data.survey.title).toContain('(Copy)');
    expect(data.sections.length).toBeGreaterThan(0);
    expect(data.questions.length).toBeGreaterThan(0);
  });

  it('exports and imports a survey definition', async () => {
    const { surveyId } = await createPublishedSurvey();

    // Export
    const exportRes = await authedRequest(`/api/surveys/${surveyId}/definition`);
    expect(exportRes.status).toBe(200);
    const definition = (await exportRes.json()) as { version: number; title: string; sections: unknown[] };
    expect(definition.version).toBe(1);
    expect(definition.sections.length).toBeGreaterThan(0);

    // Import
    const importRes = await authedRequest('/api/surveys/import', {
      method: 'POST',
      body: JSON.stringify(definition),
    });
    expect(importRes.status).toBe(201);
    const imported = (await importRes.json()) as { survey: { id: string } };
    expect(imported.survey.id).not.toBe(surveyId);
  });
});

describe('Sections and Questions', () => {
  beforeAll(async () => {
    await getAdminCookie();
  });

  it('creates sections and questions', async () => {
    const surveyRes = await authedRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: 'Sections Test' }),
    });
    const { id: surveyId } = (await surveyRes.json()) as { id: string };

    const sectionRes = await authedRequest(`/api/surveys/${surveyId}/sections`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Section A' }),
    });
    expect(sectionRes.status).toBe(201);
    const section = (await sectionRes.json()) as { id: string };

    const questionRes = await authedRequest(`/api/sections/${section.id}/questions`, {
      method: 'POST',
      body: JSON.stringify({
        text: 'Q1',
        type: 'radio',
        options: [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }],
      }),
    });
    expect(questionRes.status).toBe(201);
  });

  it('reorders sections', async () => {
    const surveyRes = await authedRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ title: 'Reorder Test' }),
    });
    const { id: surveyId } = (await surveyRes.json()) as { id: string };

    const s1 = (await (await authedRequest(`/api/surveys/${surveyId}/sections`, {
      method: 'POST',
      body: JSON.stringify({ title: 'First' }),
    })).json()) as { id: string };

    const s2 = (await (await authedRequest(`/api/surveys/${surveyId}/sections`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Second' }),
    })).json()) as { id: string };

    const res = await authedRequest(`/api/surveys/${surveyId}/sections/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ items: [{ id: s2.id, sort_order: 0 }, { id: s1.id, sort_order: 1 }] }),
    });
    expect(res.status).toBe(204);
  });
});
