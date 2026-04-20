import { describe, expect, it, beforeAll } from 'vitest';
import { request, authedRequest, getAdminCookie, createPublishedSurvey } from './helpers';

describe('Results API', () => {
  let surveyId: string;
  let slug: string;
  let questionIds: string[];

  beforeAll(async () => {
    await getAdminCookie();
    const survey = await createPublishedSurvey({ slug: `results-test-${Date.now()}` });
    surveyId = survey.surveyId;
    slug = survey.slug;
    questionIds = survey.questionIds;

    // Create a completed respondent
    const resumeRes = await request(`/api/s/${slug}/resume`);
    const ridCookie = resumeRes.headers.get('set-cookie')?.split(';')[0] ?? '';

    await request(`/api/s/${slug}/answers/batch`, {
      method: 'POST',
      cookie: ridCookie,
      body: JSON.stringify({
        answers: [
          { questionId: questionIds[0], value: 'A' },
          { questionId: questionIds[1], value: 'Test Name' },
          { questionId: questionIds[2], value: '8' },
        ],
      }),
    });

    await request(`/api/s/${slug}/complete`, { method: 'POST', cookie: ridCookie });
  });

  it('gets aggregated results', async () => {
    const res = await authedRequest(`/api/surveys/${surveyId}/results`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { respondentCounts: { total: number; completed: number }; results: unknown[] };
    expect(data.respondentCounts.completed).toBe(1);
    expect(data.results.length).toBeGreaterThan(0);
  });

  it('gets live results', async () => {
    const res = await authedRequest(`/api/surveys/${surveyId}/results/live`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { liveCounts: { activeViewers: number; activeRespondents: number } };
    expect(data.liveCounts).toBeDefined();
  });

  it('gets timeline data', async () => {
    const res = await authedRequest(`/api/surveys/${surveyId}/results/timeline?granularity=day`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<{ period: string; started: number; completed: number }>;
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].started).toBeGreaterThanOrEqual(data[0].completed);
  });

  it('gets dropoff data', async () => {
    const res = await authedRequest(`/api/surveys/${surveyId}/results/dropoff`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<{ questionId: string; dropoffRate: number }>;
    expect(data.length).toBe(3);
  });

  it('lists respondents with pagination', async () => {
    const res = await authedRequest(`/api/surveys/${surveyId}/results/respondents?offset=0&limit=10`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { respondents: Array<{ id: string }>; total: number };
    expect(data.total).toBe(1);
    expect(data.respondents.length).toBe(1);
  });

  it('gets respondent detail', async () => {
    const listRes = await authedRequest(`/api/surveys/${surveyId}/results/respondents`);
    const { respondents } = (await listRes.json()) as { respondents: Array<{ id: string }> };

    const res = await authedRequest(`/api/surveys/${surveyId}/results/respondents/${respondents[0].id}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { answers: Array<{ questionId: string; value: string }> };
    expect(data.answers.length).toBe(3);
  });

  it('searches text answers', async () => {
    const res = await authedRequest(`/api/surveys/${surveyId}/results/search?q=Test`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<{ answer: string }>;
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].answer).toContain('Test');
  });

  it('deletes a respondent', async () => {
    const listRes = await authedRequest(`/api/surveys/${surveyId}/results/respondents`);
    const { respondents } = (await listRes.json()) as { respondents: Array<{ id: string }> };

    const res = await authedRequest(`/api/surveys/${surveyId}/results/respondents/${respondents[0].id}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);

    // Verify deleted
    const afterRes = await authedRequest(`/api/surveys/${surveyId}/results/respondents`);
    const after = (await afterRes.json()) as { total: number };
    expect(after.total).toBe(0);
  });

  it('exports CSV', async () => {
    const res = await authedRequest(`/api/surveys/${surveyId}/results/export?format=csv`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
  });

  it('exports JSON', async () => {
    const res = await authedRequest(`/api/surveys/${surveyId}/results/export?format=json`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
