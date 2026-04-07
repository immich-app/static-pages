import { test, expect, type Page } from '@playwright/test';
import { apiPost, apiPut, ensureAuth, parseCookie } from './helpers';

interface SetupResult {
  surveyId: string;
  slug: string;
  sectionId: string;
  questionIds: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
  };
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

async function waitForTransition(page: Page) {
  await page.waitForTimeout(400);
}

async function dismissSectionHeader(page: Page) {
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function createConditionalSurvey(): Promise<SetupResult> {
  const slug = `e2e-cond-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const survey = await apiPost('/api/surveys', { title: 'Conditional Logic Test' });
  const section = await apiPost(`/api/surveys/${survey.id}/sections`, { title: 'Section 1' });

  // Q1: Radio question with Yes/No options
  const q1 = await apiPost(`/api/sections/${section.id}/questions`, {
    text: 'Do you like testing?',
    type: 'radio',
    required: true,
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
  });

  // Q2: Text question shown only if Q1 equals "Yes"
  const q2 = await apiPost(`/api/sections/${section.id}/questions`, {
    text: 'What do you like about testing?',
    type: 'text',
    required: true,
    placeholder: 'Tell us more',
    conditional: {
      showIf: {
        questionId: q1.id,
        condition: 'equals',
        value: 'Yes',
      },
    },
  });

  // Q3: Text question shown only if Q1 equals "No"
  const q3 = await apiPost(`/api/sections/${section.id}/questions`, {
    text: 'What would make testing better?',
    type: 'text',
    required: true,
    placeholder: 'Your suggestions',
    conditional: {
      showIf: {
        questionId: q1.id,
        condition: 'equals',
        value: 'No',
      },
    },
  });

  // Q4: Unconditional text question
  const q4 = await apiPost(`/api/sections/${section.id}/questions`, {
    text: 'Any final thoughts?',
    type: 'text',
    required: false,
    placeholder: 'Optional feedback',
  });

  await apiPut(`/api/surveys/${survey.id}`, { slug });
  await apiPut(`/api/surveys/${survey.id}/publish`);

  return {
    surveyId: survey.id,
    slug,
    sectionId: section.id,
    questionIds: { q1: q1.id, q2: q2.id, q3: q3.id, q4: q4.id },
  };
}

test.describe.serial('Conditional skip logic', () => {
  let setup: SetupResult;

  test.beforeAll(async () => {
    setup = await createConditionalSurvey();
  });

  test('choosing "Yes" shows Q2, skips Q3, shows Q4', async ({ page }) => {
    await page.goto(`/s/${setup.slug}`);
    await page.getByRole('button', { name: 'Get Started' }).click();

    // Dismiss section header
    await dismissSectionHeader(page);
    await waitForTransition(page);

    // Q1: Radio - select "Yes"
    await expect(page.getByText('Do you like testing?')).toBeVisible({ timeout: 3000 });
    await page.getByRole('radio', { name: 'Yes' }).click();

    // Radio auto-advances -> Q2 should appear (conditional: showIf Q1 equals "Yes")
    await expect(page.getByText('What do you like about testing?')).toBeVisible({ timeout: 3000 });
    await page.getByPlaceholder('Tell us more').fill('Everything!');
    await waitForTransition(page);
    await page
      .getByRole('button', { name: /Next|Submit/ })
      .first()
      .click();

    // Q3 should be skipped -> Q4 should appear
    await expect(page.getByText('Any final thoughts?')).toBeVisible({ timeout: 3000 });

    // Q3 should not be visible (it was skipped)
    await expect(page.getByText('What would make testing better?')).not.toBeVisible();
  });

  test('choosing "No" skips Q2, shows Q3, shows Q4', async ({ page }) => {
    await page.goto(`/s/${setup.slug}`);
    await page.getByRole('button', { name: 'Get Started' }).click();

    // Dismiss section header
    await dismissSectionHeader(page);
    await waitForTransition(page);

    // Q1: Radio - select "No"
    await expect(page.getByText('Do you like testing?')).toBeVisible({ timeout: 3000 });
    await page.getByRole('radio', { name: 'No' }).click();

    // Radio auto-advances -> Q2 should be skipped -> Q3 should appear (conditional: showIf Q1 equals "No")
    await expect(page.getByText('What would make testing better?')).toBeVisible({ timeout: 3000 });
    await page.getByPlaceholder('Your suggestions').fill('More automation');
    await waitForTransition(page);
    await page
      .getByRole('button', { name: /Next|Submit/ })
      .first()
      .click();

    // Q4 should appear
    await expect(page.getByText('Any final thoughts?')).toBeVisible({ timeout: 3000 });

    // Q2 should not be visible (it was skipped)
    await expect(page.getByText('What do you like about testing?')).not.toBeVisible();
  });
});
