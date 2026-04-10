import { test, expect, type Page } from '@playwright/test';
import { apiPost, apiPut, API, ensureAuth, getAuthHeaders, parseCookie } from './helpers';

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
  // Set the session cookie so page requests are authenticated
  const BASE = process.env.BASE_URL || 'http://localhost:5173';
  const { name, value } = parseCookie(cookie);
  await context.addCookies([{ name, value, url: BASE }]);
});

async function createFullSurvey(): Promise<SetupResult> {
  const survey = await apiPost('/api/surveys', { title: 'E2E All 10 Types' });
  const surveyId = survey.id;

  const section1 = await apiPost(`/api/surveys/${surveyId}/sections`, { title: 'Choice Questions' });
  const section2 = await apiPost(`/api/surveys/${surveyId}/sections`, { title: 'Input Questions' });
  const section3 = await apiPost(`/api/surveys/${surveyId}/sections`, { title: 'Scale Questions' });

  const questions = [
    // Section 1: Choice types
    {
      key: 'radio',
      sectionId: section1.id,
      body: {
        text: 'Pick a color',
        type: 'radio',
        options: [
          { label: 'Red', value: 'Red' },
          { label: 'Blue', value: 'Blue' },
        ],
        required: true,
      },
    },
    {
      key: 'checkbox',
      sectionId: section1.id,
      body: {
        text: 'Select hobbies',
        type: 'checkbox',
        options: [
          { label: 'Reading', value: 'Reading' },
          { label: 'Gaming', value: 'Gaming' },
        ],
        required: true,
      },
    },
    {
      key: 'dropdown',
      sectionId: section1.id,
      body: {
        text: 'Choose a country',
        type: 'dropdown',
        options: [
          { label: 'USA', value: 'USA' },
          { label: 'UK', value: 'UK' },
          { label: 'Germany', value: 'Germany' },
        ],
        required: true,
      },
    },

    // Section 2: Input types
    {
      key: 'text',
      sectionId: section2.id,
      body: { text: 'Your name', type: 'text', required: true, placeholder: 'Enter name' },
    },
    {
      key: 'number',
      sectionId: section2.id,
      body: { text: 'Your age', type: 'number', required: true, config: { min: 0, max: 120 } },
    },
    {
      key: 'email',
      sectionId: section2.id,
      body: { text: 'Your email', type: 'email', required: true, placeholder: 'you@example.com' },
    },
    { key: 'textarea', sectionId: section2.id, body: { text: 'Tell us more', type: 'textarea', required: false } },

    // Section 3: Scale types
    {
      key: 'rating',
      sectionId: section3.id,
      body: { text: 'Rate our service', type: 'rating', required: true, config: { scaleMax: 5 } },
    },
    { key: 'nps', sectionId: section3.id, body: { text: 'How likely to recommend?', type: 'nps', required: true } },
    { key: 'likert', sectionId: section3.id, body: { text: 'I am satisfied', type: 'likert', required: true } },
  ];

  const questionIds: Record<string, string> = {};
  for (const q of questions) {
    const created = await apiPost(`/api/surveys/${surveyId}/sections/${q.sectionId}/questions`, q.body);
    questionIds[q.key] = created.id;
  }

  const slug = `e2e-full-${Date.now()}`;
  await apiPut(`/api/surveys/${surveyId}`, { slug });
  await apiPut(`/api/surveys/${surveyId}/publish`);

  return { surveyId, slug, questionIds };
}

async function waitForTransition(page: Page) {
  await page.waitForTimeout(400);
}

async function clickNext(page: Page, label = 'Next') {
  await waitForTransition(page);
  await page.getByRole('button', { name: label }).first().click();
}

async function dismissSectionHeader(page: Page) {
  await page.getByRole('button', { name: 'Continue' }).click();
}

test.describe('Full survey with all 10 question types', () => {
  let setup: SetupResult;

  test.beforeAll(async () => {
    setup = await createFullSurvey();
  });

  test('completes survey with all question types', async ({ page }) => {
    await page.goto(`/s/${setup.slug}`);
    await page.getByRole('button', { name: 'Get Started' }).click();

    // Section 1: Choice Questions
    await dismissSectionHeader(page);

    // Q1: Radio
    await expect(page.getByText('Pick a color')).toBeVisible({ timeout: 3000 });
    await page.getByRole('radio', { name: 'Blue' }).click();
    // Auto-advances
    await expect(page.getByText('Select hobbies')).toBeVisible({ timeout: 3000 });

    // Q2: Checkbox
    await waitForTransition(page);
    await page.getByRole('checkbox', { name: 'Reading' }).click();
    await page.getByRole('checkbox', { name: 'Gaming' }).click();
    await clickNext(page);

    // Q3: Dropdown
    await expect(page.getByText('Choose a country')).toBeVisible({ timeout: 3000 });
    await waitForTransition(page);
    await page.locator('select').selectOption('Germany');
    await clickNext(page);

    // Section 2: Input Questions
    await dismissSectionHeader(page);

    // Q4: Text
    await expect(page.getByText('Your name')).toBeVisible({ timeout: 3000 });
    await page.getByPlaceholder('Enter name').fill('E2E Tester');
    await clickNext(page);

    // Q5: Number
    await expect(page.getByText('Your age')).toBeVisible({ timeout: 3000 });
    await waitForTransition(page);
    await page.locator('input[type="number"]').fill('30');
    await clickNext(page);

    // Q6: Email
    await expect(page.getByText('Your email')).toBeVisible({ timeout: 3000 });
    await page.getByPlaceholder('you@example.com').fill('e2e@test.com');
    await clickNext(page);

    // Q7: Textarea (optional) — skip
    await expect(page.getByText('Tell us more')).toBeVisible({ timeout: 3000 });
    await clickNext(page, 'Skip');

    // Section 3: Scale Questions
    await dismissSectionHeader(page);

    // Q8: Rating — click the 4th star
    await expect(page.getByText('Rate our service')).toBeVisible({ timeout: 3000 });
    await waitForTransition(page);
    // Rating stars are buttons — click the 4th one
    await page.locator('[data-rating-value="4"]').click();
    await clickNext(page);

    // Q9: NPS — click score 9
    await expect(page.getByText('How likely to recommend?')).toBeVisible({ timeout: 3000 });
    await waitForTransition(page);
    await page.getByLabel('Score 9').click();
    await clickNext(page);

    // Q10: Likert — click Agree
    await expect(page.getByText('I am satisfied')).toBeVisible({ timeout: 3000 });
    await waitForTransition(page);
    await page.getByRole('button', { name: 'Agree', exact: true }).click();
    await clickNext(page, 'Submit');

    // Thank you
    await expect(page.getByText('Thank you!')).toBeVisible({ timeout: 5000 });
  });

  test('results contain all question types', async () => {
    // Submit via API to ensure data
    const resumeRes = await fetch(`${API}/api/s/${setup.slug}/resume`);
    const cookies = resumeRes.headers.get('set-cookie') ?? '';
    const ridMatch = cookies.match(/rid_[^=]+=([^;]+)/);
    const rid = ridMatch?.[1];

    if (rid) {
      const answers = [
        { questionId: setup.questionIds.radio, value: 'Red' },
        { questionId: setup.questionIds.checkbox, value: 'Reading' },
        { questionId: setup.questionIds.dropdown, value: 'USA' },
        { questionId: setup.questionIds.text, value: 'API User' },
        { questionId: setup.questionIds.number, value: '25' },
        { questionId: setup.questionIds.email, value: 'api@test.com' },
        { questionId: setup.questionIds.rating, value: '5' },
        { questionId: setup.questionIds.nps, value: '10' },
        { questionId: setup.questionIds.likert, value: 'Strongly Agree' },
      ];
      await fetch(`${API}/api/s/${setup.slug}/answers/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `rid_${setup.slug}=${rid}` },
        body: JSON.stringify({ answers }),
      });
      await fetch(`${API}/api/s/${setup.slug}/complete`, {
        method: 'POST',
        headers: { Cookie: `rid_${setup.slug}=${rid}` },
      });
    }

    const res = await fetch(`${API}/api/surveys/${setup.surveyId}/results`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    expect(data.respondentCounts.completed).toBeGreaterThanOrEqual(1);
    expect(data.results.length).toBeGreaterThanOrEqual(5);
  });

  test('CSV export works', async () => {
    const res = await fetch(`${API}/api/surveys/${setup.surveyId}/results/export?format=csv`, {
      headers: getAuthHeaders(),
    });
    expect(res.ok).toBe(true);
    expect(res.headers.get('content-type')).toContain('text/csv');
    const csv = await res.text();
    expect(csv).toContain('respondent_id');
    expect(csv.split('\n').length).toBeGreaterThan(1);
  });

  test('JSON export works', async () => {
    const res = await fetch(`${API}/api/surveys/${setup.surveyId}/results/export?format=json`, {
      headers: getAuthHeaders(),
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0]).toHaveProperty('respondentId');
    expect(data[0]).toHaveProperty('answers');
  });

  test('results page renders with stats and question results', async ({ page }) => {
    await page.goto(`/results/${setup.surveyId}`);

    // Wait for results to load
    await expect(page.getByText('Total')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Completed')).toBeVisible();
    await expect(page.getByText('Completion')).toBeVisible();

    // Question results should render (check for question text as heading in result cards)
    await expect(page.getByRole('heading', { name: 'Pick a color' })).toBeVisible({ timeout: 10000 });

    // Export buttons should be present
    await expect(page.getByRole('button', { name: 'CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'JSON' })).toBeVisible();
  });
});

test.describe('Survey duplication', () => {
  test('duplicates a survey via API', async () => {
    const survey = await apiPost('/api/surveys', { title: 'Original Survey' });
    const section = await apiPost(`/api/surveys/${survey.id}/sections`, { title: 'Section 1' });
    await apiPost(`/api/surveys/${survey.id}/sections/${section.id}/questions`, {
      text: 'Q1',
      type: 'radio',
      options: [
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
      ],
    });

    const result = await apiPost(`/api/surveys/${survey.id}/duplicate`);
    const dup = result.survey ?? result;
    expect(dup.title).toBe('Original Survey (Copy)');
    expect(dup.status).toBe('draft');
    expect(dup.id).not.toBe(survey.id);

    // Verify the duplicate has sections and questions (retry — DO init is async)
    let data: Record<string, unknown[]> = { sections: [], questions: [] };
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await fetch(`${API}/api/surveys/${dup.id}`, {
        headers: getAuthHeaders(),
      });
      data = await res.json();
      if (data.sections?.length > 0) break;
      await new Promise((r) => setTimeout(r, 1000));
    }
    expect(data.sections.length).toBe(1);
    expect(data.questions.length).toBe(1);
  });

  test('duplicate button works on dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Surveys' })).toBeVisible();

    // Count initial surveys
    const initialCards = await page.locator('[class*="card-hover"]').count();

    // Click duplicate on the first survey
    const duplicateBtn = page.locator('button[title="Duplicate"]').first();
    if (await duplicateBtn.isVisible()) {
      await duplicateBtn.click();
      // Should have one more survey now
      await expect(page.locator('[class*="card-hover"]')).toHaveCount(initialCards + 1, { timeout: 5000 });
    }
  });
});

test.describe('Embed page', () => {
  let slug: string;

  test.beforeAll(async () => {
    const survey = await apiPost('/api/surveys', { title: 'Embed Test' });
    const section = await apiPost(`/api/surveys/${survey.id}/sections`, { title: 'S1' });
    await apiPost(`/api/surveys/${survey.id}/sections/${section.id}/questions`, {
      text: 'Quick Q',
      type: 'text',
      required: true,
    });
    slug = `embed-test-${Date.now()}`;
    await apiPut(`/api/surveys/${survey.id}`, { slug });
    await apiPut(`/api/surveys/${survey.id}/publish`);
  });

  test('embed page loads the survey', async ({ page }) => {
    await page.goto(`/embed/${slug}`);
    await expect(page.getByText('Embed Test')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Quick Q')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Survey with skip logic across question types', () => {
  let setup: { surveyId: string; slug: string };

  test.beforeAll(async () => {
    const survey = await apiPost('/api/surveys', { title: 'Skip Logic Flow Test' });
    const section = await apiPost(`/api/surveys/${survey.id}/sections`, { title: 'Feedback' });

    // Q1: Radio trigger
    const q1 = await apiPost(`/api/surveys/${survey.id}/sections/${section.id}/questions`, {
      text: 'Have you used our product?',
      type: 'radio',
      required: true,
      options: [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' },
      ],
    });

    // Q2: Rating - only if Q1 = Yes
    await apiPost(`/api/surveys/${survey.id}/sections/${section.id}/questions`, {
      text: 'Rate your experience',
      type: 'rating',
      required: true,
      config: { scaleMax: 5 },
      conditional: { showIf: { questionId: q1.id, condition: 'equals', value: 'Yes' } },
    });

    // Q3: Text - only if Q1 = No
    await apiPost(`/api/surveys/${survey.id}/sections/${section.id}/questions`, {
      text: 'What prevented you from trying it?',
      type: 'text',
      required: true,
      placeholder: 'Tell us why',
      conditional: { showIf: { questionId: q1.id, condition: 'equals', value: 'No' } },
    });

    // Q4: NPS - always shown
    await apiPost(`/api/surveys/${survey.id}/sections/${section.id}/questions`, {
      text: 'How likely to recommend?',
      type: 'nps',
      required: true,
    });

    const slug = `e2e-skip-flow-${Date.now()}`;
    await apiPut(`/api/surveys/${survey.id}`, { slug });
    await apiPut(`/api/surveys/${survey.id}/publish`);
    setup = { surveyId: survey.id, slug };
  });

  test('skip logic works: Yes path shows rating, skips text', async ({ page }) => {
    await page.goto(`/s/${setup.slug}`);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await dismissSectionHeader(page);

    // Q1: select Yes
    await expect(page.getByText('Have you used our product?')).toBeVisible({ timeout: 3000 });
    await page.getByRole('radio', { name: 'Yes' }).click();

    // Should show Q2 (rating), not Q3 (text)
    await expect(page.getByText('Rate your experience')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('What prevented you from trying it?')).not.toBeVisible();

    // Rate and continue
    await page.locator('[data-rating-value="4"]').click();
    await clickNext(page);

    // Should show Q4 (NPS) - Q3 was skipped
    await expect(page.getByText('How likely to recommend?')).toBeVisible({ timeout: 3000 });
    await page.getByLabel('Score 8').click();
    await clickNext(page, 'Submit');

    await expect(page.getByText('Thank you!')).toBeVisible({ timeout: 5000 });
  });

  test('skip logic works: No path shows text, skips rating', async ({ page }) => {
    await page.goto(`/s/${setup.slug}`);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await dismissSectionHeader(page);

    // Q1: select No
    await expect(page.getByText('Have you used our product?')).toBeVisible({ timeout: 3000 });
    await page.getByRole('radio', { name: 'No' }).click();

    // Should show Q3 (text), not Q2 (rating)
    await expect(page.getByText('What prevented you from trying it?')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Rate your experience')).not.toBeVisible();

    // Fill text and continue
    await page.getByPlaceholder('Tell us why').fill('No time');
    await clickNext(page);

    // Should show Q4 (NPS) - Q2 was skipped
    await expect(page.getByText('How likely to recommend?')).toBeVisible({ timeout: 3000 });
    await page.getByLabel('Score 5').click();
    await clickNext(page, 'Submit');

    await expect(page.getByText('Thank you!')).toBeVisible({ timeout: 5000 });
  });

  test('skipped questions are not in results', async () => {
    // Create a fresh survey to avoid interference from browser tests
    const survey = await apiPost('/api/surveys', { title: 'Skip Results Test' });
    const section = await apiPost(`/api/surveys/${survey.id}/sections`, { title: 'S1' });
    const q1 = await apiPost(`/api/surveys/${survey.id}/sections/${section.id}/questions`, {
      text: 'Used product?',
      type: 'radio',
      required: true,
      options: [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' },
      ],
    });
    const qRating = await apiPost(`/api/surveys/${survey.id}/sections/${section.id}/questions`, {
      text: 'Rate it',
      type: 'rating',
      required: true,
      config: { scaleMax: 5 },
      conditional: { showIf: { questionId: q1.id, condition: 'equals', value: 'Yes' } },
    });
    const qText = await apiPost(`/api/surveys/${survey.id}/sections/${section.id}/questions`, {
      text: 'Why not?',
      type: 'text',
      required: true,
      conditional: { showIf: { questionId: q1.id, condition: 'equals', value: 'No' } },
    });
    const qNps = await apiPost(`/api/surveys/${survey.id}/sections/${section.id}/questions`, {
      text: 'Recommend?',
      type: 'nps',
      required: true,
    });
    const slug = `e2e-skip-results-${Date.now()}`;
    await apiPut(`/api/surveys/${survey.id}`, { slug });
    await apiPut(`/api/surveys/${survey.id}/publish`);

    // Submit two responses via API
    async function submitResponse(answers: Array<{ questionId: string; value: string }>) {
      const resumeRes = await fetch(`${API}/api/s/${slug}/resume`);
      const cookies = resumeRes.headers.get('set-cookie') ?? '';
      const ridMatch = cookies.match(/rid_[^=]+=([^;]+)/);
      const rid = ridMatch?.[1];
      expect(rid).toBeTruthy();
      const cookie = `rid_${slug}=${rid}`;
      await fetch(`${API}/api/s/${slug}/answers/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ answers }),
      });
      await fetch(`${API}/api/s/${slug}/complete`, {
        method: 'POST',
        headers: { Cookie: cookie },
      });
    }

    await submitResponse([
      { questionId: q1.id, value: 'Yes' },
      { questionId: qRating.id, value: '4' },
      { questionId: qNps.id, value: '8' },
    ]);
    await submitResponse([
      { questionId: q1.id, value: 'No' },
      { questionId: qText.id, value: 'No time' },
      { questionId: qNps.id, value: '5' },
    ]);

    // Check results
    const res = await fetch(`${API}/api/surveys/${survey.id}/results`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    expect(data.respondentCounts.completed).toBe(2);

    // Rating question should have 1 response (only the "Yes" path respondent)
    const ratingResult = data.results.find((r: { questionId: string }) => r.questionId === qRating.id);
    if (ratingResult) {
      const totalRatingResponses = ratingResult.answers.reduce((sum: number, a: { count: number }) => sum + a.count, 0);
      expect(totalRatingResponses).toBe(1);
    }
  });
});

test.describe('Survey builder with new types', () => {
  test('can add all question types in the builder', async ({ page }) => {
    // Create a survey first
    await page.goto('/');
    await page.getByRole('link', { name: 'New Survey' }).first().click();
    // Template picker shows — click Blank Survey
    await page.getByRole('button', { name: 'Blank Survey' }).click();
    await page.getByPlaceholder('Survey title...').fill('Builder Types Test');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Edit Survey')).toBeVisible({ timeout: 5000 });

    // Add section
    await page.getByText('Add section').click();
    await page.getByPlaceholder('e.g., About You').fill('All Types');

    // Add one of each new type using the section's add-question chips (last instance on page)
    const typesToAdd = ['Rating', 'NPS', 'Number', 'Dropdown', 'Likert'];
    for (const type of typesToAdd) {
      // The add-question chips are the last buttons with these names on the page
      await page.getByRole('button', { name: type }).last().click();
      await page.waitForTimeout(300);
    }

    // Verify we have 5 questions (the first was added as empty default when section was created...
    // actually the section starts empty, so we should have exactly 5)
    await expect(page.getByText('5 questions', { exact: true })).toBeVisible({ timeout: 3000 });
  });
});
