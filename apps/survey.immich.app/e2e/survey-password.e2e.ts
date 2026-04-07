import { test, expect, type Page } from '@playwright/test';
import { apiPost, apiPut, API, ensureAuth, parseCookie } from './helpers';

interface SetupResult {
  surveyId: string;
  slug: string;
  sectionId: string;
  questionId: string;
}

const SURVEY_PASSWORD = 'test-survey-pass-42';

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

async function createPasswordProtectedSurvey(): Promise<SetupResult> {
  const slug = `e2e-pwd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const survey = await apiPost('/api/surveys', { title: 'Password Protected Survey' });
  const section = await apiPost(`/api/surveys/${survey.id}/sections`, { title: 'Section 1' });
  const question = await apiPost(`/api/sections/${section.id}/questions`, {
    text: 'What is your name?',
    type: 'text',
    required: true,
    placeholder: 'Enter your name',
  });

  await apiPut(`/api/surveys/${survey.id}`, { slug, password: SURVEY_PASSWORD });
  await apiPut(`/api/surveys/${survey.id}/publish`);

  return { surveyId: survey.id, slug, sectionId: section.id, questionId: question.id };
}

test.describe.serial('Password-protected survey', () => {
  let setup: SetupResult;

  test.beforeAll(async () => {
    setup = await createPasswordProtectedSurvey();
  });

  test('visiting the public URL shows the password gate', async ({ page }) => {
    await page.goto(`/s/${setup.slug}`);

    // The password gate should be visible
    await expect(page.getByText('This survey is password protected')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Password Protected Survey')).toBeVisible();
    await expect(page.getByPlaceholder('Enter password')).toBeVisible();
  });

  test('entering wrong password shows an error', async ({ page }) => {
    await page.goto(`/s/${setup.slug}`);
    await expect(page.getByText('This survey is password protected')).toBeVisible({ timeout: 5000 });

    // Enter wrong password
    await page.getByPlaceholder('Enter password').fill('wrong-password');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Should show an error message
    await expect(page.getByText(/incorrect|invalid|wrong/i)).toBeVisible({ timeout: 5000 });

    // Password gate should still be visible
    await expect(page.getByText('This survey is password protected')).toBeVisible();
  });

  test('entering correct password allows access to the survey', async ({ page }) => {
    await page.goto(`/s/${setup.slug}`);
    await expect(page.getByText('This survey is password protected')).toBeVisible({ timeout: 5000 });

    // Enter correct password
    await page.getByPlaceholder('Enter password').fill(SURVEY_PASSWORD);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Should show the welcome screen with Get Started
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible({ timeout: 5000 });
  });

  test('full flow: password -> fill survey -> submit', async ({ page }) => {
    await page.goto(`/s/${setup.slug}`);
    await expect(page.getByText('This survey is password protected')).toBeVisible({ timeout: 5000 });

    // Enter correct password
    await page.getByPlaceholder('Enter password').fill(SURVEY_PASSWORD);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Welcome screen
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Get Started' }).click();

    // Dismiss section header
    await dismissSectionHeader(page);
    await waitForTransition(page);

    // Answer the text question
    await expect(page.getByText('What is your name?')).toBeVisible({ timeout: 3000 });
    await page.getByPlaceholder('Enter your name').fill('E2E Password Tester');
    await waitForTransition(page);

    // Submit
    await page.getByRole('button', { name: 'Submit' }).first().click();

    // Thank you screen
    await expect(page.getByText('Thank you!')).toBeVisible({ timeout: 5000 });
  });
});
