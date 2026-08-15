import { test, expect } from '@playwright/test';
import { startOidcServer, ISSUER } from './oidc-server';
import { API, TEST_PASSWORD } from './helpers';

const BASE = process.env.BASE_URL || 'http://localhost:5173';

// Serial because setup must precede login.
test.describe.serial('Password auth', () => {
  let needsSetup = false;
  test.beforeAll(async () => {
    const res = await fetch(`${API}/api/auth/me`);
    const data = (await res.json()) as { needsSetup?: boolean };
    needsSetup = !!data.needsSetup;
  });

  test('first visit shows setup screen', async ({ page }) => {
    test.skip(!needsSetup, 'Admin already set up — requires fresh database');
    await page.goto('/');
    await expect(page.getByText('Welcome to FUTO Surveys')).toBeVisible();
    await expect(page.getByText('Set up your admin password')).toBeVisible();
  });

  test('short password is rejected', async ({ page }) => {
    test.skip(!needsSetup, 'Admin already set up — requires fresh database');
    await page.goto('/');
    await expect(page.getByText('Welcome to FUTO Surveys')).toBeVisible();

    await page.getByPlaceholder('At least 8 characters').fill('short');
    await page.getByPlaceholder('Confirm password').fill('short');
    await page.getByRole('button', { name: 'Create Admin Account' }).click();

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('mismatched passwords are rejected', async ({ page }) => {
    test.skip(!needsSetup, 'Admin already set up — requires fresh database');
    await page.goto('/');
    await expect(page.getByText('Welcome to FUTO Surveys')).toBeVisible();

    await page.getByPlaceholder('At least 8 characters').fill('validpassword1');
    await page.getByPlaceholder('Confirm password').fill('differentpassword');
    await page.getByRole('button', { name: 'Create Admin Account' }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('can create admin password and auto-login', async ({ page }) => {
    test.skip(!needsSetup, 'Admin already set up — requires fresh database');
    await page.goto('/');
    await expect(page.getByText('Welcome to FUTO Surveys')).toBeVisible();

    await page.getByPlaceholder('At least 8 characters').fill(TEST_PASSWORD);
    await page.getByPlaceholder('Confirm password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Create Admin Account' }).click();

    await expect(page.getByText('FUTO Surveys')).toBeVisible();
    await expect(page.getByText('admin', { exact: false })).toBeVisible();
  });

  test('after setup, new context shows login screen', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE);

    await expect(page.getByText('Sign in to FUTO Surveys')).toBeVisible();
    await expect(page.getByPlaceholder('Admin password')).toBeVisible();

    await context.close();
  });

  test('wrong password shows error', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE);
    await expect(page.getByText('Sign in to FUTO Surveys')).toBeVisible();

    await page.getByPlaceholder('Admin password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page.getByText('Invalid password')).toBeVisible();

    await context.close();
  });

  test('correct password logs in and shows dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE);
    await expect(page.getByText('Sign in to FUTO Surveys')).toBeVisible();

    await page.getByPlaceholder('Admin password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page.locator('header').getByText('FUTO Surveys')).toBeVisible({ timeout: 5000 });

    await context.close();
  });

  test('logout clears session and shows login', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE);

    await expect(page.getByText('Sign in to FUTO Surveys')).toBeVisible();
    await page.getByPlaceholder('Admin password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByText('FUTO Surveys')).toBeVisible();

    await page.getByTitle('Log out').click();

    await expect(page.getByText('Sign in to FUTO Surveys')).toBeVisible();

    await context.close();
  });

  test('protected page redirects to login when not authenticated', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE}/create`);

    await expect(page.getByText('Sign in to FUTO Surveys')).toBeVisible();

    await context.close();
  });
});

test.describe.serial('OIDC auth', () => {
  let oidcServer: Awaited<ReturnType<typeof startOidcServer>> | null = null;
  let oidcAvailable = false;

  test.beforeAll(async () => {
    try {
      const meRes = await fetch(`${API}/api/auth/me`);
      const me = (await meRes.json()) as { oidcEnabled?: boolean };
      if (!me.oidcEnabled) {
        console.log('OIDC is not enabled on the backend — skipping OIDC tests');
        return;
      }
    } catch {
      console.log('Backend not reachable — skipping OIDC tests');
      return;
    }

    try {
      oidcServer = await startOidcServer();
      const disco = await fetch(`${ISSUER}/.well-known/openid-configuration`);
      if (disco.ok) {
        oidcAvailable = true;
      }
    } catch (err) {
      console.log('Failed to start OIDC server:', err);
    }
  });

  test.afterAll(async () => {
    if (oidcServer) {
      await oidcServer.stop();
    }
  });

  test('login screen shows SSO button when OIDC is configured', async ({ browser }) => {
    test.skip(!oidcAvailable, 'OIDC server not available');

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE);

    await expect(page.getByRole('button', { name: 'Sign in with SSO' })).toBeVisible();

    await context.close();
  });

  test('clicking SSO redirects to OIDC provider', async ({ browser }) => {
    test.skip(!oidcAvailable, 'OIDC server not available');

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE);

    await page.getByRole('button', { name: 'Sign in with SSO' }).click();

    await page.waitForURL(/localhost:9090/);
    expect(page.url()).toContain('localhost:9090');

    await context.close();
  });

  test('OIDC login flow authenticates and redirects back', async ({ browser }) => {
    test.skip(!oidcAvailable, 'OIDC server not available');

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE);

    await page.getByRole('button', { name: 'Sign in with SSO' }).click();

    await page.waitForURL(/localhost:9090\/interaction\//);

    await page.locator('input[name="login"]').fill('admin@test.com');
    await page.locator('input[name="password"]').fill('testpassword');
    await page.locator('button[type="submit"]').click();

    try {
      await page.locator('button:has-text("Authorize")').waitFor({ timeout: 3000 });
      await page.locator('button:has-text("Authorize")').click();
    } catch {
      // No consent screen — that's fine
    }

    await page.waitForURL(/localhost:(5173|8787|3000)/, { timeout: 10_000 });

    await expect(page.locator('header').getByText('FUTO Surveys')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Test Admin')).toBeVisible({ timeout: 5000 });

    await context.close();
  });

  test('OIDC user has correct role from claims', async ({ browser }) => {
    test.skip(!oidcAvailable, 'OIDC server not available');

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE);

    await page.getByRole('button', { name: 'Sign in with SSO' }).click();
    await page.waitForURL(/localhost:9090\/interaction\//);

    await page.locator('input[name="login"]').fill('editor@test.com');
    await page.locator('input[name="password"]').fill('testpassword');
    await page.locator('button[type="submit"]').click();

    try {
      await page.locator('button:has-text("Authorize")').waitFor({ timeout: 3000 });
      await page.locator('button:has-text("Authorize")').click();
    } catch {
      // No consent screen
    }

    await page.waitForURL(/localhost:(5173|8787|3000)/, { timeout: 10_000 });

    await expect(page.getByText('Test Editor')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('editor', { exact: true })).toBeVisible();

    await context.close();
  });
});
