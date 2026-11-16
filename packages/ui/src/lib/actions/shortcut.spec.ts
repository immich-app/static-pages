import { shortcut } from '#lib/actions/shortcut.js';
import { describe, expect, it, vi } from 'vitest';

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

describe('shortcut', () => {
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
