import { toastManager } from '#lib/services/toast-manager.svelte.js';
import { test } from '#test/fixtures.js';
import { afterEach, beforeAll, beforeEach, describe, expect, vi } from 'vitest';

describe('toastManager', () => {
  beforeAll(() => toastManager.mount());

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('show', () => {
    test('replaces a visible toast that has the same id', async ({ app }) => {
      toastManager.show({ title: 'Uploading' }, { id: 'upload' });

      toastManager.show({ title: 'Uploaded' }, { id: 'upload' });

      await expect.element(app.text('Uploaded')).toBeVisible();
      await expect.element(app.text('Uploading')).not.toBeInTheDocument();
    });

    test('keeps a replaced toast open past the earlier timeout', async ({ app }) => {
      toastManager.show({ title: 'Saving' }, { id: 'save', timeout: 3000 });
      vi.advanceTimersByTime(2000);
      toastManager.show({ title: 'Saved' }, { id: 'save', timeout: 3000 });

      vi.advanceTimersByTime(1500);

      await expect.element(app.text('Saved')).toBeVisible();
    });
  });
});
