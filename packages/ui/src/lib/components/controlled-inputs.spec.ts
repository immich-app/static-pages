import ControlledField from '#test/components/ControlledField.svelte';
import { test } from '#test/fixtures.js';
import { describe, expect } from 'vitest';

describe('controlled inputs', () => {
  describe.each([
    { accept: true, selected: 'Viewer, Remove', single: 'Remove', checked: true },
    { accept: false, selected: 'Viewer', single: 'Viewer', checked: false },
  ])('when the owner accept is $accept', ({ accept, selected, single, checked }) => {
    test('select shows the value its owner holds', async ({ app, render }) => {
      await render(ControlledField, { label: 'Role', input: 'select', accept });

      await app.selectOption('Role', 'Remove');

      await expect.element(app.combobox('Role')).toHaveTextContent(single);
    });

    test('select marks the option its owner holds', async ({ app, render }) => {
      await render(ControlledField, { label: 'Role', input: 'select', accept });
      await app.selectOption('Role', 'Remove');

      await app.combobox('Role').click();

      await expect.element(app.option(single)).toHaveAttribute('aria-selected', 'true');
    });

    test('multi select shows the values its owner holds', async ({ app, render }) => {
      await render(ControlledField, { label: 'Roles', input: 'multi-select', accept });

      await app.selectOption('Roles', 'Remove');

      await expect.element(app.combobox('Roles')).toHaveTextContent(selected);
    });

    test('switch shows the state its owner holds', async ({ app, render }) => {
      await render(ControlledField, { label: 'Enabled', input: 'switch', accept });

      await app.switch('Enabled').click();

      await expect.element(app.switch('Enabled')).toHaveAttribute('aria-checked', String(checked));
    });

    test('checkbox shows the state its owner holds', async ({ app, render }) => {
      await render(ControlledField, { label: 'Accept', input: 'checkbox', accept });

      await app.checkbox('Accept').click();

      await expect.element(app.checkbox('Accept')).toHaveAttribute('aria-checked', String(checked));
    });
  });
});
