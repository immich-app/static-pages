import { test, expect } from '@playwright/test';
import { startOidcServer, ISSUER } from './oidc-server';
import { API, TEST_PASSWORD } from './helpers';

const BASE = process.env.BASE_URL || 'http://localhost:5173';

// ---------------------------------------------------------------------------
// Password auth tests — serial because setup must precede login
// ---------------------------------------------------------------------------
test.describe.serial('Password auth', () => {
  test('first visit shows setup screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Welcome to FUTO Surveys')).toBeVisible();
    await expect(page.getByText('Set up your admin password')).toBeVisible();
  });

  test('short password is rejected', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Welcome to FUTO Surveys')).toBeVisible();

    await page.getByPlaceholder('At least 8 characters').fill('short');
    await page.getByPlaceholder('Confirm password').fill('short');
    await page.getByRole('button', { name: 'Create Admin Account' }).click();

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('mismatched passwords are rejected', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Welcome to FUTO Surveys')).toBeVisible();

    await page.getByPlaceholder('At least 8 characters').fill('validpassword1');
    await page.getByPlaceholder('Confirm password').fill('differentpassword');
    await page.getByRole('button', { name: 'Create Admin Account' }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('can create admin password and auto-login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Welcome to FUTO Surveys')).toBeVisible();

    await page.getByPlaceholder('At least 8 characters').fill(TEST_PASSWORD);
    await page.getByPlaceholder('Confirm password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Create Admin Account' }).click();

    // After setup, user is auto-logged-in and sees the dashboard header
    await expect(page.getByText('FUTO Surveys')).toBeVisible();
    await expect(page.getByText('admin', { exact: false })).toBeVisible();
  });

  test('after setup, new context shows login screen', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE);

    // Should show the login screen (not setup)
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
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid password')).toBeVisible();

    await context.close();
  });

  test('correct password logs in and shows dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE);
    await expect(page.getByText('Sign in to FUTO Surveys')).toBeVisible();

    await page.getByPlaceholder('Admin password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Should see the authenticated header
    await expect(page.getByText('FUTO Surveys')).toBeVisible();
    await expect(page.getByText('admin', { exact: false })).toBeVisible();

    await context.close();
  });

  test('logout clears session and shows login', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE);

    // Log in first
    await expect(page.getByText('Sign in to FUTO Surveys')).toBeVisible();
    await page.getByPlaceholder('Admin password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('FUTO Surveys')).toBeVisible();

    // Click logout
    await page.getByTitle('Log out').click();

    // Should redirect to login screen
    await expect(page.getByText('Sign in to FUTO Surveys')).toBeVisible();

    await context.close();
  });

  test('protected page redirects to login when not authenticated', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE}/create`);

    // Should show login instead of create page
    await expect(page.getByText('Sign in to FUTO Surveys')).toBeVisible();

    await context.close();
  });
});

// ---------------------------------------------------------------------------
// OIDC auth tests — require the local OIDC server
// ---------------------------------------------------------------------------
test.describe.serial('OIDC auth', () => {
  let oidcServer: Awaited<ReturnType<typeof startOidcServer>> | null = null;
  let oidcAvailable = false;

  test.beforeAll(async () => {
    // Check if the backend is configured for our test OIDC server
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

    // Start the OIDC test server
    try {
      oidcServer = await startOidcServer();
      // Verify the discovery endpoint is accessible
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

    // Should redirect through the backend to the OIDC provider
    await page.waitForURL(/localhost:9090/);
    expect(page.url()).toContain('localhost:9090');

    await context.close();
  });

  test('OIDC login flow authenticates and redirects back', async ({ browser }) => {
    test.skip(!oidcAvailable, 'OIDC server not available');

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE);

    // Click SSO button
    await page.getByRole('button', { name: 'Sign in with SSO' }).click();

    // Wait for OIDC provider login page
    await page.waitForURL(/localhost:9090\/interaction\//);

    // Fill in credentials on the OIDC provider's login form
    await page.locator('input[name="login"]').fill('admin@test.com');
    await page.locator('input[name="password"]').fill('testpassword');
    await page.locator('button[type="submit"]').click();

    // Handle consent screen if it appears
    try {
      await page.locator('button:has-text("Authorize")').waitFor({ timeout: 3000 });
      await page.locator('button:has-text("Authorize")').click();
    } catch {
      // No consent screen — that's fine
    }

    // Should redirect back to the app
    await page.waitForURL(/localhost:(5173|8787)/, { timeout: 10_000 });

    // Should be authenticated with the admin role
    await expect(page.getByText('FUTO Surveys')).toBeVisible();
    await expect(page.getByText('Test Admin')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('admin', { exact: false })).toBeVisible();

    await context.close();
  });

  test('OIDC user has correct role from claims', async ({ browser }) => {
    test.skip(!oidcAvailable, 'OIDC server not available');

    // Login as editor to verify role mapping works
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE);

    await page.getByRole('button', { name: 'Sign in with SSO' }).click();
    await page.waitForURL(/localhost:9090\/interaction\//);

    await page.locator('input[name="login"]').fill('editor@test.com');
    await page.locator('input[name="password"]').fill('testpassword');
    await page.locator('button[type="submit"]').click();

    // Handle consent if needed
    try {
      await page.locator('button:has-text("Authorize")').waitFor({ timeout: 3000 });
      await page.locator('button:has-text("Authorize")').click();
    } catch {
      // No consent screen
    }

    await page.waitForURL(/localhost:(5173|8787)/, { timeout: 10_000 });

    // Should show editor role
    await expect(page.getByText('Test Editor')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('editor', { exact: false })).toBeVisible();

    await context.close();
  });
});
