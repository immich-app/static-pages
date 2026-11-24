import { shortcut } from '#lib/actions/shortcut.js';
import { test } from '#test/fixtures.js';
import { describe, expect, it, onTestFinished, vi } from 'vitest';

const keydown = (init: { key: string; isComposing?: boolean; keyCode?: number }) => {
  const event = new Event('keydown', { cancelable: true });
  return Object.assign(event, {
    key: init.key,
    isComposing: init.isComposing ?? false,
    keyCode: init.keyCode ?? 13,
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
  });
};

const bindEnter = () => {
  const node = new EventTarget() as HTMLElement;
  const onShortcut = vi.fn();
  shortcut({ shortcut: { key: 'Enter' }, onShortcut })(node);
  return { node, onShortcut };
};

const mount = (html: string) => {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.append(host);
  onTestFinished(() => host.remove());
};

const bindSlashOnBody = () => {
  const onShortcut = vi.fn();
  onTestFinished(shortcut({ shortcut: { key: '/' }, onShortcut })(document.body) as () => void);
  return onShortcut;
};

const editableFields = [
  { kind: 'text input', html: '<input type="text" aria-label="Field">' },
  { kind: 'search input', html: '<input type="search" aria-label="Field">' },
  { kind: 'url input', html: '<input type="url" aria-label="Field">' },
  { kind: 'tel input', html: '<input type="tel" aria-label="Field">' },
  { kind: 'number input', html: '<input type="number" aria-label="Field">' },
  { kind: 'time input', html: '<input type="time" aria-label="Field">' },
  { kind: 'textarea', html: '<textarea aria-label="Field"></textarea>' },
  { kind: 'select', html: '<select aria-label="Field"><option>a</option><option>/b</option></select>' },
  { kind: 'contenteditable', html: '<div contenteditable="true" aria-label="Field"></div>' },
];

const textFields = [
  { kind: 'search input', html: '<input type="search" aria-label="Field">' },
  { kind: 'url input', html: '<input type="url" aria-label="Field">' },
  { kind: 'tel input', html: '<input type="tel" aria-label="Field">' },
];

describe('shortcut', () => {
  test.for(editableFields)('ignores a key typed in a $kind', async ({ html }, { app }) => {
    mount(html);
    const onShortcut = bindSlashOnBody();

    await app.typeInField('Field', '/');

    expect(onShortcut).not.toHaveBeenCalled();
  });

  test.for(textFields)('keeps a typed / in a $kind', async ({ html }, { app }) => {
    mount(html);
    bindSlashOnBody();

    await app.typeInField('Field', 'a/b');

    await expect.element(app.field('Field')).toHaveValue('a/b');
  });

  test('keeps a typed / in a contenteditable', async ({ app }) => {
    mount('<div contenteditable="true" aria-label="Field"></div>');
    bindSlashOnBody();

    await app.typeInField('Field', 'a/b');

    await expect.element(app.field('Field')).toHaveTextContent('a/b');
  });

  test('runs while a checkbox has focus', async ({ app }) => {
    mount('<input type="checkbox" aria-label="Field">');
    const onShortcut = bindSlashOnBody();

    await app.typeInField('Field', '/');

    expect(onShortcut).toHaveBeenCalledOnce();
  });

  it('runs the handler for a matching key', () => {
    const { node, onShortcut } = bindEnter();
    const event = keydown({ key: 'Enter' });

    node.dispatchEvent(event);

    expect(onShortcut).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves a key that commits IME composition to the IME', () => {
    const { node, onShortcut } = bindEnter();
    const event = keydown({ key: 'Enter', isComposing: true });

    node.dispatchEvent(event);

    expect(onShortcut).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('leaves the keyCode 229 Enter that Safari sends when committing IME composition to the IME', () => {
    const { node, onShortcut } = bindEnter();

    node.dispatchEvent(keydown({ key: 'Enter', keyCode: 229 }));

    expect(onShortcut).not.toHaveBeenCalled();
  });
});
