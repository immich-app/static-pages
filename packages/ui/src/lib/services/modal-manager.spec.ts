import { modalManager } from '#lib/services/modal-manager.svelte.js';
import TestModal from '#test/components/TestModal.svelte';
import { test } from '#test/fixtures.js';
import type { App } from '#test/app.js';
import { afterEach, describe, expect } from 'vitest';

describe('modalManager', () => {
  afterEach(() => modalManager.closeAll());

  describe('open', () => {
    test('lets the top modal close after the modal below it closes', async ({ app }) => {
      const lower = modalManager.open(TestModal, { title: 'Lower' });
      await expect.element(app.modal('Lower')).toBeVisible();
      const upper = modalManager.open(TestModal, { title: 'Upper' });
      await expect.element(app.modal('Upper')).toBeVisible();
      await lower.close();

      await app.pressKey('{Escape}');

      await expect.poll(() => modalManager.isOpen()).toBe(false);
      await expect(upper.onClose).resolves.toBeUndefined();
    });

    test('hides the lower modal while the top modal is open', async ({ app }) => {
      modalManager.open(TestModal, { title: 'Lower' });
      await expect.element(app.modal('Lower')).toBeVisible();

      modalManager.open(TestModal, { title: 'Upper' });

      await expect.element(app.modal('Upper')).toBeVisible();
      await expect.element(app.modal('Lower')).not.toBeInTheDocument();
    });

    test.for([
      { via: 'Escape', closeUpper: (app: App) => app.pressKey('{Escape}') },
      { via: 'its close button', closeUpper: (app: App) => app.modalCloseButton('Upper').click() },
    ])('keeps the lower modal input after the top modal closes with $via', async ({ closeUpper }, { app }) => {
      modalManager.open(TestModal, { title: 'Lower' });
      await app.textarea('Lower note').fill('draft');
      modalManager.open(TestModal, { title: 'Upper' });
      await expect.element(app.modal('Upper')).toBeVisible();

      await closeUpper(app);

      await expect.element(app.modal('Upper')).not.toBeInTheDocument();
      await expect.element(app.textarea('Lower note')).toHaveValue('draft');
      await expect.element(app.textarea('Lower note')).toHaveFocus();
    });

    test('hides a page modal while a modal is open above it', async ({ app, render }) => {
      render(TestModal, { title: 'Page', onClose: () => {} });
      await expect.element(app.modal('Page')).toBeVisible();

      modalManager.open(TestModal, { title: 'Upper' });

      await expect.element(app.modal('Upper')).toBeVisible();
      await expect.element(app.modal('Page')).not.toBeInTheDocument();
    });

    test('keeps the page modal input after the modal above it closes', async ({ app, render }) => {
      render(TestModal, { title: 'Page', onClose: () => {} });
      await app.textarea('Page note').fill('draft');
      const upper = modalManager.open(TestModal, { title: 'Upper' });
      await expect.element(app.modal('Upper')).toBeVisible();

      await upper.close();

      await expect.element(app.modal('Page')).toBeVisible();
      await expect.element(app.textarea('Page note')).toHaveValue('draft');
    });
  });

  describe('closeAll', () => {
    test('closes every open modal', async ({ app }) => {
      const lower = modalManager.open(TestModal, { title: 'Lower' });
      const upper = modalManager.open(TestModal, { title: 'Upper' });
      await expect.element(app.modal('Upper')).toBeVisible();

      await modalManager.closeAll();

      expect(modalManager.isOpen()).toBe(false);
      await expect(Promise.all([lower.onClose, upper.onClose])).resolves.toEqual([undefined, undefined]);
      await expect.element(app.modal('Lower')).not.toBeInTheDocument();
      await expect.element(app.modal('Upper')).not.toBeInTheDocument();
    });
  });
});
