import { test, expect } from '@playwright/test';
import { apiPost, apiPut, apiGet, API, ensureAuth, getAuthHeaders, parseCookie } from './helpers';

interface SetupResult {
  surveyId: string;
  slug: string;
  questionIds: Record<string, string>;
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

async function createResultsSurvey(): Promise<SetupResult> {
  const survey = await apiPost('/api/surveys', { title: 'Results Features Test' });
  const surveyId = survey.id;

  const section = await apiPost(`/api/surveys/${surveyId}/sections`, { title: 'Feedback' });

  const questionIds: Record<string, string> = {};

  const q1 = await apiPost(`/api/surveys/${surveyId}/sections/${section.id}/questions`, {
    text: 'Favorite color',
    type: 'radio',
    required: true,
    options: [
      { label: 'Red', value: 'Red' },
      { label: 'Blue', value: 'Blue' },
      { label: 'Green', value: 'Green' },
    ],
  });
  questionIds['color'] = q1.id;

  const q2 = await apiPost(`/api/surveys/${surveyId}/sections/${section.id}/questions`, {
    text: 'Your name',
    type: 'text',
    required: true,
    placeholder: 'Enter your name',
  });
  questionIds['name'] = q2.id;

  const q3 = await apiPost(`/api/surveys/${surveyId}/sections/${section.id}/questions`, {
    text: 'Rate our service',
    type: 'rating',
    required: true,
    config: { scaleMax: 5 },
  });
  questionIds['rating'] = q3.id;

  const slug = `e2e-results-${Date.now()}`;
  await apiPut(`/api/surveys/${surveyId}`, { slug });
  await apiPut(`/api/surveys/${surveyId}/publish`);

  return { surveyId, slug, questionIds };
}

async function submitResponse(slug: string, answers: Array<{ questionId: string; value: string }>): Promise<void> {
  const resumeRes = await fetch(`${API}/api/s/${slug}/resume`);
  const cookies = resumeRes.headers.get('set-cookie') ?? '';
  const ridMatch = cookies.match(/rid_[^=]+=([^;]+)/);
  const rid = ridMatch?.[1];
  expect(rid).toBeTruthy();

  await fetch(`${API}/api/s/${slug}/answers/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `rid_${slug}=${rid}` },
    body: JSON.stringify({ answers }),
  });

  await fetch(`${API}/api/s/${slug}/complete`, {
    method: 'POST',
    headers: { Cookie: `rid_${slug}=${rid}` },
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Results page features
// ──────────────────────────────────────────────────────────────────────────────
test.describe.serial('Results page features', () => {
  let setup: SetupResult;

  test.beforeAll(async () => {
    setup = await createResultsSurvey();

    // Submit 3 responses with varied data
    await submitResponse(setup.slug, [
      { questionId: setup.questionIds.color, value: 'Red' },
      { questionId: setup.questionIds.name, value: 'Alice Johnson' },
      { questionId: setup.questionIds.rating, value: '5' },
    ]);

    await submitResponse(setup.slug, [
      { questionId: setup.questionIds.color, value: 'Blue' },
      { questionId: setup.questionIds.name, value: 'Bob Smith' },
      { questionId: setup.questionIds.rating, value: '4' },
    ]);

    await submitResponse(setup.slug, [
      { questionId: setup.questionIds.color, value: 'Red' },
      { questionId: setup.questionIds.name, value: 'Charlie Davis' },
      { questionId: setup.questionIds.rating, value: '3' },
    ]);
  });

  test('overview tab shows stats cards and question results', async ({ page }) => {
    await page.goto(`/results/${setup.surveyId}`);

    // Wait for results to load - stats cards should appear
    await expect(page.getByText('Total')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Completed')).toBeVisible();
    await expect(page.getByText('Completion')).toBeVisible();

    // Question result sections should be displayed
    await expect(page.getByRole('heading', { name: 'Favorite color' })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole('heading', { name: 'Your name' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rate our service' })).toBeVisible();

    // Export buttons should be present
    await expect(page.getByRole('button', { name: 'CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'JSON' })).toBeVisible();
  });

  test('responses tab shows respondent list', async ({ page }) => {
    await page.goto(`/results/${setup.surveyId}`);
    await expect(page.getByText('Total')).toBeVisible({ timeout: 10000 });

    // Click the Responses tab
    await page.getByRole('button', { name: 'Responses' }).click();

    // Verify the respondent table appears with column headers
    await expect(page.getByText('Respondent')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Status')).toBeVisible();
    await expect(page.getByText('Answers')).toBeVisible();

    // There should be at least 3 rows with "Complete" status
    const completeLabels = page.locator('text=Complete');
    await expect(completeLabels.first()).toBeVisible({ timeout: 5000 });
    expect(await completeLabels.count()).toBeGreaterThanOrEqual(3);
  });

  test('search tab finds text answers', async ({ page }) => {
    await page.goto(`/results/${setup.surveyId}`);
    await expect(page.getByText('Total')).toBeVisible({ timeout: 10000 });

    // Click the Search tab
    await page.getByRole('button', { name: 'Search' }).click();

    // Verify the search UI appears
    await expect(page.getByPlaceholder('Search answers...')).toBeVisible({ timeout: 5000 });

    // Search for "Alice"
    await page.getByPlaceholder('Search answers...').fill('Alice');

    // Wait for debounced search results
    await expect(page.getByText('Alice Johnson')).toBeVisible({ timeout: 5000 });

    // Verify result card shows the question text context (within search results, not the filter dropdown)
    await expect(page.locator('.space-y-2 >> text=Your name')).toBeVisible();

    // Verify showing result count
    await expect(page.getByText(/Showing \d+ of \d+ result/)).toBeVisible();
  });

  test('clicking a search result expands the full respondent detail with match highlight', async ({ page }) => {
    await page.goto(`/results/${setup.surveyId}`);
    await expect(page.getByText('Total')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByPlaceholder('Search answers...').fill('Alice');
    await expect(page.getByText('Alice Johnson')).toBeVisible({ timeout: 5000 });

    // "Red" isn't in the search results (only the matched 'name' answer is),
    // so asserting it becomes visible after clicking proves the expansion
    // loaded the full respondent detail.
    await expect(page.getByText('Red', { exact: true })).toHaveCount(0);

    // The search row is a button; click it to expand
    const resultRow = page.locator('button', { has: page.getByText('Alice Johnson') }).first();
    await resultRow.click();

    // The inline detail panel now shows every answer this respondent gave,
    // and the matched question ('Your name') gets a "match" chip.
    await expect(page.getByText('match', { exact: true })).toBeVisible({ timeout: 5000 });
    // Red (their favourite color) was not in the search results — appearing
    // now proves the expansion pulled the full respondent record.
    await expect(page.getByText('Red', { exact: true })).toBeVisible();

    // Clicking the same row collapses the detail — the match chip disappears
    await resultRow.click();
    await expect(page.getByText('match', { exact: true })).toHaveCount(0);
  });

  test('completion-time and question-timing charts appear on overview', async ({ page }) => {
    await page.goto(`/results/${setup.surveyId}`);
    await expect(page.getByText('Total')).toBeVisible({ timeout: 10000 });

    // Both analytics cards should render on the overview tab. The heading text
    // is the easiest selector.
    await expect(page.getByRole('heading', { name: 'Time to Complete' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Time per Question' })).toBeVisible();
  });

  test('CSV export triggers download', async ({ page }) => {
    await page.goto(`/results/${setup.surveyId}`);
    await expect(page.getByText('Total')).toBeVisible({ timeout: 10000 });

    // Set up download listener before clicking
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // Click CSV export button
    await page.getByRole('button', { name: 'CSV' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('results API returns correct data', async () => {
    const res = await fetch(`${API}/api/surveys/${setup.surveyId}/results`, {
      headers: getAuthHeaders(),
    });
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(data.respondentCounts.completed).toBe(3);
    expect(data.respondentCounts.total).toBeGreaterThanOrEqual(3);
    expect(data.results.length).toBe(3); // 3 questions
  });

  test('search API returns matching answers', async () => {
    const res = await fetch(`${API}/api/surveys/${setup.surveyId}/results/search?q=Bob`, { headers: getAuthHeaders() });
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(data.total).toBeGreaterThanOrEqual(1);
    expect(data.results[0].answer).toContain('Bob');
  });
});
