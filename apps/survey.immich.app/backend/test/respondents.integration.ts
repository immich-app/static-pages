import { describe, expect, it, beforeAll } from 'vitest';
import { request, authedRequest, getAdminCookie, createPublishedSurvey } from './helpers';

describe('Respondent Flow', () => {
  let slug: string;
  let questionIds: string[];

  beforeAll(async () => {
    await getAdminCookie();
    const survey = await createPublishedSurvey({ slug: `respondent-test-${Date.now()}` });
    slug = survey.slug;
    questionIds = survey.questionIds;
  });

  it('gets published survey', async () => {
    const res = await request(`/api/s/${slug}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { survey: { title: string }; sections: unknown[]; questions: unknown[] };
    expect(data.survey.title).toBeTruthy();
    expect(data.questions.length).toBe(3);
  });

  it('resumes and creates new respondent', async () => {
    const res = await request(`/api/s/${slug}/resume`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { isComplete: boolean; answers: Record<string, unknown> };
    expect(data.isComplete).toBe(false);
    // New respondent cookie is set
    expect(res.headers.get('set-cookie')).toBeTruthy();
  });

  it('submits batch answers and completes', async () => {
    // Get respondent
    const resumeRes = await request(`/api/s/${slug}/resume`);
    const ridCookie = resumeRes.headers.get('set-cookie')?.split(';')[0] ?? '';

    // Submit answers
    const batchRes = await request(`/api/s/${slug}/answers/batch`, {
      method: 'POST',
      cookie: ridCookie,
      body: JSON.stringify({
        answers: [
          { questionId: questionIds[0], value: 'A' },
          { questionId: questionIds[1], value: 'Test User' },
          { questionId: questionIds[2], value: '9' },
        ],
      }),
    });
    expect(batchRes.status).toBe(204);

    // Complete
    const completeRes = await request(`/api/s/${slug}/complete`, {
      method: 'POST',
      cookie: ridCookie,
    });
    expect(completeRes.status).toBe(204);

    // Resume returns completed
    const resumeAgain = await request(`/api/s/${slug}/resume`, { cookie: ridCookie });
    const data = (await resumeAgain.json()) as { isComplete: boolean };
    expect(data.isComplete).toBe(true);
  });

  it('rejects answers for questions not in survey', async () => {
    const resumeRes = await request(`/api/s/${slug}/resume`);
    const ridCookie = resumeRes.headers.get('set-cookie')?.split(';')[0] ?? '';

    const res = await request(`/api/s/${slug}/answers/batch`, {
      method: 'POST',
      cookie: ridCookie,
      body: JSON.stringify({
        answers: [{ questionId: 'fake-question-id', value: 'test' }],
      }),
    });
    expect(res.status).toBe(400);
  });
});

describe('Survey Password Protection', () => {
  let slug: string;

  beforeAll(async () => {
    await getAdminCookie();
    const survey = await createPublishedSurvey({
      slug: `password-test-${Date.now()}`,
      password: 'survey-pass-1234',
    });
    slug = survey.slug;
  });

  it('password-protected survey requires auth', async () => {
    const res = await request(`/api/s/${slug}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { requiresPassword?: boolean; questions: unknown[] };
    expect(data.requiresPassword).toBe(true);
    expect(data.questions).toEqual([]);
  });

  it('wrong password returns 403', async () => {
    const res = await request(`/api/s/${slug}/auth`, {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
    });
    expect(res.status).toBe(403);
  });

  it('correct password grants access', async () => {
    const authRes = await request(`/api/s/${slug}/auth`, {
      method: 'POST',
      body: JSON.stringify({ password: 'survey-pass-1234' }),
    });
    expect(authRes.status).toBe(204);
    const pwCookie = authRes.headers.get('set-cookie')?.split(';')[0] ?? '';

    // Now can access the survey
    const surveyRes = await request(`/api/s/${slug}`, { cookie: pwCookie });
    const data = (await surveyRes.json()) as { questions: unknown[] };
    expect(data.questions.length).toBe(3);
  });
});
