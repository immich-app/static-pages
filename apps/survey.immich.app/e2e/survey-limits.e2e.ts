import { test, expect } from '@playwright/test';
import { apiPost, apiPut, apiRawGet, API, ensureAuth, parseCookie } from './helpers';

interface SurveySetup {
  surveyId: string;
  slug: string;
  questionIds: string[];
}

let cookie: string;

test.beforeAll(async () => {
  cookie = await ensureAuth();
});

test.beforeEach(async ({ context }) => {
  const BASE = process.env.BASE_URL || 'http://localhost:5173';
  const { name, value } = parseCookie(cookie);
  await context.addCookies([{ name, value, url: BASE }]);
});

async function createSurveyWithQuestion(opts: {
  title: string;
  slug: string;
  maxResponses?: number;
  closesAt?: string;
}): Promise<SurveySetup> {
  const survey = await apiPost('/api/surveys', { title: opts.title });
  const section = await apiPost(`/api/surveys/${survey.id}/sections`, { title: 'Section 1' });
  const question = await apiPost(`/api/sections/${section.id}/questions`, {
    text: 'Pick one',
    type: 'radio',
    required: true,
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
  });

  await apiPut(`/api/surveys/${survey.id}`, {
    slug: opts.slug,
    ...(opts.maxResponses !== undefined ? { max_responses: opts.maxResponses } : {}),
    ...(opts.closesAt ? { closes_at: opts.closesAt } : {}),
  });
  await apiPut(`/api/surveys/${survey.id}/publish`);

  return { surveyId: survey.id, slug: opts.slug, questionIds: [question.id] };
}

async function submitOneResponse(slug: string, questionId: string): Promise<void> {
  // Resume to get a respondent cookie
  const resumeRes = await fetch(`${API}/api/s/${slug}/resume`);
  const cookies = resumeRes.headers.get('set-cookie') ?? '';
  const ridMatch = cookies.match(/rid_[^=]+=([^;]+)/);
  const rid = ridMatch?.[1];
  expect(rid).toBeTruthy();

  // Submit answer
  await fetch(`${API}/api/s/${slug}/answers/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `rid_${slug}=${rid}` },
    body: JSON.stringify({ answers: [{ questionId, value: 'Yes' }] }),
  });

  // Complete the response
  await fetch(`${API}/api/s/${slug}/complete`, {
    method: 'POST',
    headers: { Cookie: `rid_${slug}=${rid}` },
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// max_responses limit
// ──────────────────────────────────────────────────────────────────────────────
test.describe.serial('Survey with max_responses limit', () => {
  let setup: SurveySetup;

  test.beforeAll(async () => {
    const slug = `e2e-maxresp-${Date.now()}`;
    setup = await createSurveyWithQuestion({
      title: 'Max Responses Limit Test',
      slug,
      maxResponses: 1,
    });
  });

  test('allows the first response via API', async () => {
    await submitOneResponse(setup.slug, setup.questionIds[0]);

    // Verify via API that the response was recorded
    const resumeRes = await apiRawGet(`/api/s/${setup.slug}/resume`);
    expect(resumeRes.status).toBe(403);
    const body = await resumeRes.json();
    expect(body.error).toContain('maximum');
  });

  test('shows error in browser after max_responses reached', async ({ page }) => {
    await page.goto(`/s/${setup.slug}`);

    // The survey should show an error about reaching the maximum
    await expect(page.locator('text=maximum').or(page.locator('text=closed'))).toBeVisible({
      timeout: 10000,
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// closes_at past date
// ──────────────────────────────────────────────────────────────────────────────
test.describe.serial('Survey with past closes_at date', () => {
  let setup: SurveySetup;

  test.beforeAll(async () => {
    const slug = `e2e-closed-${Date.now()}`;
    setup = await createSurveyWithQuestion({
      title: 'Closed Survey Test',
      slug,
      closesAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    });
  });

  test('API blocks resume on a closed survey', async () => {
    const res = await apiRawGet(`/api/s/${setup.slug}/resume`);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('closed');
  });

  test('shows closed message in browser', async ({ page }) => {
    await page.goto(`/s/${setup.slug}`);

    // The survey page should display an error about the survey being closed
    await expect(page.locator('text=closed')).toBeVisible({ timeout: 10000 });
  });
});
