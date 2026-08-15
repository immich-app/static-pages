import { test, expect, type Page } from '@playwright/test';
import { apiPost, apiPut, apiGet, apiRawGet, API, ensureAuth, parseCookie } from './helpers';

let cookie: string;

test.beforeAll(async () => {
  cookie = await ensureAuth();
});

test.beforeEach(async ({ context }) => {
  const BASE = process.env.BASE_URL || 'http://localhost:5173';
  const { name, value } = parseCookie(cookie);
  await context.addCookies([{ name, value, url: BASE }]);
});

async function waitForTransition(page: Page) {
  await page.waitForTimeout(400);
}

async function dismissSectionHeader(page: Page) {
  await page.getByRole('button', { name: 'Continue' }).click();
}

interface SurveySetup {
  surveyId: string;
  slug: string;
  sectionId: string;
  questionIds: string[];
}

async function createSimpleSurvey(opts?: {
  title?: string;
  slug?: string;
  questionCount?: number;
  questionType?: string;
  required?: boolean;
  publish?: boolean;
  options?: Array<{ label: string; value: string }>;
  closesAt?: string;
  maxResponses?: number;
}): Promise<SurveySetup> {
  const title = opts?.title ?? 'E2E Phase2 Test';
  const slug = opts?.slug ?? `e2e-p2-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const questionCount = opts?.questionCount ?? 1;
  const questionType = opts?.questionType ?? 'radio';
  const required = opts?.required ?? true;
  const publish = opts?.publish ?? false;

  const survey = await apiPost('/api/surveys', { title });
  const section = await apiPost(`/api/surveys/${survey.id}/sections`, { title: 'Section 1' });

  const questionIds: string[] = [];
  for (let i = 0; i < questionCount; i++) {
    const body: Record<string, unknown> = {
      text: `Question ${i + 1}`,
      type: questionType,
      required,
    };
    if (['radio', 'checkbox', 'dropdown'].includes(questionType)) {
      body.options = opts?.options ?? [
        { label: 'Alpha', value: 'Alpha' },
        { label: 'Beta', value: 'Beta' },
        { label: 'Gamma', value: 'Gamma' },
      ];
    }
    const q = await apiPost(`/api/surveys/${survey.id}/sections/${section.id}/questions`, body);
    questionIds.push(q.id);
  }

  await apiPut(`/api/surveys/${survey.id}`, {
    slug,
    ...(opts?.closesAt ? { closes_at: opts.closesAt } : {}),
    ...(opts?.maxResponses !== undefined ? { max_responses: opts.maxResponses } : {}),
  });

  if (publish) {
    await apiPut(`/api/surveys/${survey.id}/publish`);
  }

  return { surveyId: survey.id, slug, sectionId: section.id, questionIds };
}

test.describe('Create page with survey templates', () => {
  test('template cards are visible and clicking one pre-populates the builder', async ({ page }) => {
    await page.goto('/create');

    await expect(page.getByText('Customer Satisfaction')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Event Feedback')).toBeVisible();
    await expect(page.getByText('Employee Engagement')).toBeVisible();
    await expect(page.getByText('Blank Survey')).toBeVisible();
  });

  test('clicking a template shows builder with pre-populated title and saves correctly', async ({ page }) => {
    await page.goto('/create');
    await expect(page.getByText('Customer Satisfaction')).toBeVisible({ timeout: 5000 });

    await page.getByText('Customer Satisfaction').first().click();
    await waitForTransition(page);

    await expect(page.getByText('Create Survey')).toBeVisible({ timeout: 5000 });
    const titleInput = page.locator('input[placeholder="Survey title..."]');
    await expect(titleInput).toHaveValue('Customer Satisfaction');

    await page.getByRole('button', { name: 'Save' }).click();

    await page.waitForURL(/\/edit\/[a-f0-9-]+/, { timeout: 10000 });
    await expect(page.getByText('Edit Survey')).toBeVisible({ timeout: 5000 });

    const url = page.url();
    const surveyId = url.match(/\/edit\/([a-f0-9-]+)/)?.[1];
    expect(surveyId).toBeTruthy();

    const data = await apiGet(`/api/surveys/${surveyId}`);
    expect(data.sections.length).toBeGreaterThanOrEqual(2);
    expect(data.questions.length).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Create page saves sections (blank survey)', () => {
  test('creates a blank survey and adds sections on edit page', async ({ page }) => {
    await page.goto('/create');
    await expect(page.getByText('Blank Survey')).toBeVisible({ timeout: 5000 });

    await page.getByText('Blank Survey').click();
    await waitForTransition(page);

    await page.locator('input[placeholder="Survey title..."]').fill('Blank Builder E2E');

    await page.getByRole('button', { name: 'Save' }).click();

    await page.waitForURL(/\/edit\/[a-f0-9-]+/, { timeout: 10000 });
    await expect(page.getByText('Edit Survey')).toBeVisible({ timeout: 5000 });

    await page.getByText('Add section').click();
    await waitForTransition(page);

    await page.getByPlaceholder('e.g., About You').fill('Demo Section');

    await page.getByRole('button', { name: 'Single Choice' }).last().click();
    await waitForTransition(page);

    await page.getByPlaceholder('What would you like to ask?').fill('Favorite fruit?');

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Changes saved')).toBeVisible({ timeout: 5000 });

    const surveyId = page.url().match(/\/edit\/([a-f0-9-]+)/)?.[1];
    expect(surveyId).toBeTruthy();

    const data = await apiGet(`/api/surveys/${surveyId}`);
    expect(data.survey.title).toBe('Blank Builder E2E');
    expect(data.sections.length).toBe(1);
    expect(data.questions.length).toBe(1);
    expect(data.questions[0].text).toBe('Favorite fruit?');
  });
});

test.describe('Preview mode', () => {
  let setup: SurveySetup;

  test.beforeAll(async () => {
    setup = await createSimpleSurvey({ title: 'Preview Test Survey' });
  });

  test('preview modal opens and shows survey content', async ({ page }) => {
    await page.goto(`/edit/${setup.surveyId}`);
    await expect(page.getByText('Edit Survey')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Preview' }).click();
    await waitForTransition(page);

    const previewModal = page.locator('.fixed.inset-0.z-50');
    await expect(previewModal).toBeVisible({ timeout: 3000 });

    const getStartedBtn = previewModal.getByRole('button', { name: 'Get Started' });
    await expect(getStartedBtn).toBeVisible({ timeout: 3000 });

    await getStartedBtn.click();
    await waitForTransition(page);

    const continueBtn = previewModal.getByRole('button', { name: 'Continue' });
    await continueBtn.click();
    await waitForTransition(page);

    await expect(previewModal.getByText('Question 1')).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await waitForTransition(page);

    await expect(page.getByText('Edit Survey')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Inline validation errors', () => {
  let setup: SurveySetup;

  test.beforeAll(async () => {
    setup = await createSimpleSurvey({
      title: 'Validation Test',
      required: true,
      publish: true,
    });
  });

  test('shows "This question is required" when submitting without answer', async ({ page }) => {
    await page.goto(`/s/${setup.slug}`);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await waitForTransition(page);

    await dismissSectionHeader(page);
    await waitForTransition(page);

    await expect(page.getByRole('heading', { name: 'Question 1' })).toBeVisible({ timeout: 3000 });

    await page
      .getByRole('button', { name: /Next|Submit/ })
      .first()
      .click();
    await waitForTransition(page);

    await expect(page.getByRole('alert').getByText('This question is required')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Keyboard navigation', () => {
  let setup: SurveySetup;

  test.beforeAll(async () => {
    setup = await createSimpleSurvey({
      title: 'Keyboard Nav Test',
      questionType: 'radio',
      questionCount: 2,
      publish: true,
    });
  });

  test('ArrowDown selects radio option via keyboard', async ({ page }) => {
    await page.goto(`/s/${setup.slug}`);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await waitForTransition(page);

    await dismissSectionHeader(page);
    await waitForTransition(page);

    await expect(page.getByRole('heading', { name: 'Question 1' })).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await waitForTransition(page);

    // Verify Alpha is selected — radio auto-advances to Question 2
    await expect(page.getByRole('heading', { name: 'Question 2' })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Survey scheduling and limits', () => {
  test('closed survey blocks responses via API', async () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const setup = await createSimpleSurvey({
      title: 'Closed Survey Test',
      closesAt: oneDayAgo,
      publish: true,
    });

    const res = await apiRawGet(`/api/s/${setup.slug}/resume`);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('closed');
  });

  test('max_responses blocks after limit is reached', async () => {
    const setup = await createSimpleSurvey({
      title: 'Max Responses Test',
      maxResponses: 1,
      publish: true,
    });

    const resume1Res = await apiRawGet(`/api/s/${setup.slug}/resume`);
    expect(resume1Res.status).toBe(200);
    const cookies1 = resume1Res.headers.get('set-cookie') ?? '';
    const ridMatch1 = cookies1.match(/rid_[^=]+=([^;]+)/);
    const rid1 = ridMatch1?.[1];
    expect(rid1).toBeTruthy();

    await fetch(`${API}/api/s/${setup.slug}/answers/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `rid_${setup.slug}=${rid1}` },
      body: JSON.stringify({ answers: [{ questionId: setup.questionIds[0], value: 'Alpha' }] }),
    });

    await fetch(`${API}/api/s/${setup.slug}/complete`, {
      method: 'POST',
      headers: { Cookie: `rid_${setup.slug}=${rid1}` },
    });

    const resume2Res = await apiRawGet(`/api/s/${setup.slug}/resume`);
    expect(resume2Res.status).toBe(403);
    const body2 = await resume2Res.json();
    expect(body2.error).toContain('maximum');
  });
});

test.describe('Question reordering via builder', () => {
  let setup: SurveySetup;

  test.beforeAll(async () => {
    setup = await createSimpleSurvey({
      title: 'Reorder Test',
      questionCount: 3,
    });
  });

  test('move up/down buttons reorder questions and save persists order', async ({ page }) => {
    await page.goto(`/edit/${setup.surveyId}`);
    await expect(page.getByText('Edit Survey')).toBeVisible({ timeout: 5000 });

    await expect(page.getByText('3 questions').first()).toBeVisible({ timeout: 3000 });

    await page.getByText('Question 3').click();
    await waitForTransition(page);

    const expandedQuestion = page.locator('[data-question-index="0-2"]');
    const moveUpButton = expandedQuestion.locator('button[title="Move up"]');
    await moveUpButton.click();
    await waitForTransition(page);

    await page.getByRole('button', { name: 'Save' }).click();
    await waitForTransition(page);
    await expect(page.getByText('Changes saved')).toBeVisible({ timeout: 5000 });

    const data = await apiGet(`/api/surveys/${setup.surveyId}`);
    const questions = data.questions.sort(
      (a: Record<string, number>, b: Record<string, number>) => a.sort_order - b.sort_order,
    );
    // Question 3 should now have sort_order 1 (moved up from 2)
    const q3 = questions.find((q: Record<string, string>) => q.text === 'Question 3');
    expect(q3.sort_order).toBe(1);
  });
});

test.describe('Question templates in builder', () => {
  let surveyId: string;

  test.beforeAll(async () => {
    const survey = await apiPost('/api/surveys', { title: 'Template Q Test' });
    const section = await apiPost(`/api/surveys/${survey.id}/sections`, { title: 'Template Section' });
    await apiPost(`/api/surveys/${survey.id}/sections/${section.id}/questions`, {
      text: 'Placeholder Q',
      type: 'text',
    });
    surveyId = survey.id;
  });

  test('template dropdown shows categories and adds a template question', async ({ page }) => {
    await page.goto(`/edit/${surveyId}`);
    await expect(page.getByText('Edit Survey')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Template' }).click();
    await waitForTransition(page);

    // Category headers need exact match so they don't match other text on the page.
    const dropdown = page.locator('.absolute.top-full');
    await expect(dropdown).toBeVisible({ timeout: 3000 });
    await expect(dropdown.getByText('Feedback', { exact: true })).toBeVisible();
    await expect(dropdown.getByText('Demographics', { exact: true })).toBeVisible();

    await dropdown.getByRole('button', { name: 'Net Promoter Score' }).click();
    await waitForTransition(page);

    await expect(page.getByText('How likely are you to recommend us to a friend or colleague?')).toBeVisible({
      timeout: 3000,
    });
  });
});

test.describe('Bulk option paste', () => {
  let surveyId: string;

  test.beforeAll(async () => {
    const survey = await apiPost('/api/surveys', { title: 'Bulk Paste Test' });
    const section = await apiPost(`/api/surveys/${survey.id}/sections`, { title: 'S1' });
    await apiPost(`/api/surveys/${survey.id}/sections/${section.id}/questions`, {
      text: 'Paste Q',
      type: 'radio',
      options: [
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
      ],
    });
    surveyId = survey.id;
  });

  test('paste options modal replaces options', async ({ page }) => {
    await page.goto(`/edit/${surveyId}`);
    await expect(page.getByText('Edit Survey')).toBeVisible({ timeout: 5000 });

    await page.getByText('Paste Q').click();
    await waitForTransition(page);

    await page.getByRole('button', { name: 'Paste options' }).click();
    await waitForTransition(page);

    await expect(page.getByRole('heading', { name: 'Paste Options' })).toBeVisible({ timeout: 3000 });

    const modal = page.locator('.fixed.inset-0.z-50');
    const textarea = modal.locator('textarea');
    await textarea.fill('Red\nGreen\nBlue\nYellow');

    await expect(modal.getByText('4 options')).toBeVisible({ timeout: 3000 });

    await modal.getByRole('button', { name: 'Apply' }).click();
    await waitForTransition(page);

    // OptionListEditor renders one input per option.
    const optionInputs = page.locator('.space-y-1\\.5 input[placeholder="Option label..."]');
    await expect(optionInputs).toHaveCount(4, { timeout: 3000 });
    await expect(optionInputs.nth(0)).toHaveValue('Red');
    await expect(optionInputs.nth(1)).toHaveValue('Green');
    await expect(optionInputs.nth(2)).toHaveValue('Blue');
    await expect(optionInputs.nth(3)).toHaveValue('Yellow');
  });
});

test.describe('Undo/redo', () => {
  let surveyId: string;

  test.beforeAll(async () => {
    const survey = await apiPost('/api/surveys', { title: 'Undo Redo Test' });
    surveyId = survey.id;
  });

  test('Ctrl+Z undoes title change', async ({ page }) => {
    await page.goto(`/edit/${surveyId}`);
    await expect(page.getByText('Edit Survey')).toBeVisible({ timeout: 5000 });

    const titleInput = page.locator('input[placeholder="Survey title..."]');
    await expect(titleInput).toHaveValue('Undo Redo Test');

    // Wait for initial snapshot to be taken (debounce timer is 500ms)
    await page.waitForTimeout(800);

    await titleInput.fill('Changed Title');
    await expect(titleInput).toHaveValue('Changed Title');

    // Wait for the changed snapshot to be recorded
    await page.waitForTimeout(800);

    // Press Ctrl+Z (Cmd+Z on Mac) twice — the undo stack contains
    // [initial state, changed state]. First undo pops the changed state
    // (no-op since it matches current), second undo pops the initial state.
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+z`);
    await page.waitForTimeout(200);
    await page.keyboard.press(`${modifier}+z`);
    await waitForTransition(page);

    await expect(titleInput).toHaveValue('Undo Redo Test', { timeout: 3000 });
  });
});

test.describe('Skip logic builder UI', () => {
  test('skip logic dropdown shows preceding questions from the same section', async ({ page }) => {
    const setup = await createSimpleSurvey({
      title: 'Skip Logic Builder Test',
      questionCount: 3,
    });

    await page.goto(`/edit/${setup.surveyId}`);
    await expect(page.getByText('Edit Survey')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /Question 3/ }).click();
    await waitForTransition(page);

    await page.getByText('Skip Logic').click();
    await waitForTransition(page);

    await expect(page.getByText('No preceding questions')).not.toBeVisible();

    await expect(page.getByText('Source question')).toBeVisible({ timeout: 3000 });
    const sourceLabel = page.getByText('Source question');
    const select = sourceLabel.locator('..').locator('select');
    await expect(select).toBeVisible();

    await expect(select.locator('option', { hasText: 'Q1:' })).toBeAttached();
    await expect(select.locator('option', { hasText: 'Q2:' })).toBeAttached();
  });

  test('first question shows no preceding questions message', async ({ page }) => {
    const setup = await createSimpleSurvey({
      title: 'Skip Logic First Q Test',
      questionCount: 2,
    });

    await page.goto(`/edit/${setup.surveyId}`);
    await expect(page.getByText('Edit Survey')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /Question 1/ }).click();
    await waitForTransition(page);

    await page.getByText('Skip Logic').click();
    await waitForTransition(page);

    await expect(page.getByText('No preceding questions')).toBeVisible({ timeout: 3000 });
  });
});
