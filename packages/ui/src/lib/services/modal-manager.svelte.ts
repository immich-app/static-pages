import { newModalContext } from '#lib/common/context.svelte.js';
import ConfirmModal from '#lib/components/ConfirmModal/ConfirmModal.svelte';
import { ModalEntry, modalState } from '#lib/state/modal-state.svelte.js';
import { mount, tick, unmount, type Component, type ComponentProps } from 'svelte';

// if `T = () => void`, `R` will be `unknown` which we turn into `void` instead
type OnCloseData<T> = T extends { onClose: (data: infer R) => void }
  ? unknown extends R
    ? void
    : R
  : T extends { onClose: (data?: infer R) => void }
    ? R | undefined
    : never;
type ExtendsEmptyObject<T> = keyof T extends never ? never : T;
// eslint-disable-next-line unicorn/prefer-smaller-scope
type StripParamIfOptional<T> = T extends void ? [] : [T];

// if the modal does not expect any props, makes the props param optional but also allows passing `{}` and `undefined`
type OptionalParamIfEmpty<T> = ExtendsEmptyObject<T> extends never ? [] | [Record<string, never> | undefined] : [T];

class ModalManager {
  show<T extends object>(Component: Component<T>, ...props: OptionalParamIfEmpty<Omit<T, 'onClose'>>) {
    return this.open(Component, ...props).onClose;
  }

  open<T extends object, K = OnCloseData<T>>(
    Component: Component<T>,
    ...props: OptionalParamIfEmpty<Omit<T, 'onClose'>>
  ) {
    type OnCloseParams = StripParamIfOptional<K>;
    let onClose: (...args: OnCloseParams) => Promise<void> = () => Promise.resolve();

    // TODO: use `Promise.withResolvers` once Chrome 109 is no longer supported
    const promise = new Promise<K>((resolve) => {
      const close = async (data?: K) => {
        entry.isClosing = true;
        await tick();
        await unmount(modal);
        modalState.remove(entry);
        resolve(data as K);
      };
      onClose = (...args: OnCloseParams) => close(args[0] as K);

      const entry = modalState.add(new ModalEntry(() => close()));
      const modal = mount(Component, {
        target: document.body,
        props: {
          ...((props?.[0] ?? {}) as T),
          onClose,
        },
        context: newModalContext(entry),
      });
    });

    return {
      onClose: promise,
      close: (...args: OnCloseParams) => onClose(...args),
    };
  }

  isOpen() {
    return modalState.entries.length > 0;
  }

  async closeAll() {
    const entries = [...modalState.entries];
    while (entries.length > 0) {
      await entries.pop()?.close?.();
    }
  }

  showDialog(options: Omit<ComponentProps<typeof ConfirmModal>, 'onClose'>) {
    return this.show(ConfirmModal, options);
  }
}

export const modalManager = new ModalManager();
