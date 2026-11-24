<script lang="ts">
  import { getModalContext, setChildContext } from '#lib/common/context.svelte.js';
  import Card from '#lib/components/Card/Card.svelte';
  import CardBody from '#lib/components/Card/CardBody.svelte';
  import CardFooter from '#lib/components/Card/CardFooter.svelte';
  import CardHeader from '#lib/components/Card/CardHeader.svelte';
  import CardTitle from '#lib/components/Card/CardTitle.svelte';
  import CloseButton from '#lib/components/CloseButton/CloseButton.svelte';
  import Icon from '#lib/components/Icon/Icon.svelte';
  import Logo from '#lib/components/Logo/Logo.svelte';
  import TooltipProvider from '#lib/components/Tooltip/TooltipProvider.svelte';
  import { ChildKey, zIndex } from '#lib/constants.js';
  import { ModalEntry, modalState } from '#lib/state/modal-state.svelte.js';
  import type { ModalSize } from '#lib/types.js';
  import { cleanClass } from '#lib/utilities/internal.js';
  import { Dialog } from 'bits-ui';
  import { onMount, type Snippet } from 'svelte';
  import { tv } from 'tailwind-variants';

  type Props = {
    title?: string;
    icon?: string | boolean;
    size?: ModalSize;
    class?: string;
    closeOnEsc?: boolean;
    closeOnBackdropClick?: boolean;
    focusOnOpen?: boolean;
    children: Snippet;
    onClose?: () => void;
    onEscapeKeydown?: (event: KeyboardEvent) => void;
    onOpenAutoFocus?: (event: Event) => void;
  };

  let {
    size = 'medium',
    onClose,
    onEscapeKeydown,
    icon = true,
    title,
    class: className,
    closeOnEsc = true,
    closeOnBackdropClick = false,
    focusOnOpen = false,
    children,
    onOpenAutoFocus,
  }: Props = $props();

  const modalStyles = tv({
    base: `bg-light dark:bg-subtle border-subtle shadow-primary/20 flex rounded-none border shadow-sm sm:rounded-2xl dark:border-white/10`,
    variants: {
      size: {
        tiny: 'h-full sm:h-min md:max-w-sm',
        small: 'h-full sm:h-min md:max-w-md',
        medium: 'h-full sm:h-min md:max-w-(--breakpoint-sm)',
        large: 'h-full sm:h-min md:max-w-(--breakpoint-md)',
        giant: 'h-full sm:h-min md:max-w-(--breakpoint-lg)',
        full: 'h-full w-full',
      },
    },
  });

  const modalContentStyles = tv({
    base: `${zIndex.ModalContent} fixed inset-0 m-auto flex max-h-dvh grow sm:p-4`,
    variants: {
      size: {
        tiny: 'sm:h-min md:max-w-sm',
        small: 'sm:h-min md:max-w-md',
        medium: 'sm:h-min md:max-w-(--breakpoint-sm)',
        large: 'sm:h-min md:max-w-(--breakpoint-md)',
        giant: 'sm:h-min md:max-w-(--breakpoint-lg)',
        full: '',
      },
    },
  });

  const { getByKey } = setChildContext(ChildKey.Modal);
  const headerChildren = $derived(getByKey(ChildKey.ModalHeader));
  const bodyChildren = $derived(getByKey(ChildKey.ModalBody));
  const footerChildren = $derived(getByKey(ChildKey.ModalFooter));

  let cardRef = $state<HTMLElement | null>(null);

  const interactOutsideBehavior = $derived(closeOnBackdropClick ? 'close' : 'ignore');
  const escapeKeydownBehavior = $derived(closeOnEsc ? 'close' : 'ignore');

  const managedEntry = getModalContext();
  const entry = managedEntry ?? new ModalEntry();
  const isHidden = $derived(modalState.isCovered(entry));

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      entry.isClosing = true;
    }
  };

  const onOpenChangeComplete = (isOpen: boolean) => {
    if (!isOpen) {
      onClose?.();
    }
  };

  const handleEscapeKeydown = (event: KeyboardEvent) => {
    event.stopImmediatePropagation();
    onEscapeKeydown?.(event);
  };

  const handleOpenAutoFocus = (event: Event) => {
    if (onOpenAutoFocus) {
      onOpenAutoFocus(event);
    } else if (!focusOnOpen) {
      event.preventDefault();
    }
  };

  onMount(() => {
    if (managedEntry) {
      return;
    }

    modalState.add(entry);
    return () => modalState.remove(entry);
  });
</script>

<Dialog.Root open {onOpenChange} {onOpenChangeComplete}>
  <Dialog.Portal>
    <Dialog.Overlay
      class={cleanClass(
        `${zIndex.ModalBackdrop} fixed inset-s-0 top-0 flex h-dvh max-h-dvh w-screen bg-black/30 dark:bg-black/70`,
        isHidden && 'hidden',
      )}
    />
    <Dialog.Content
      onOpenAutoFocus={handleOpenAutoFocus}
      onEscapeKeydown={handleEscapeKeydown}
      {escapeKeydownBehavior}
      {interactOutsideBehavior}
      class={cleanClass(modalContentStyles({ size }), isHidden && 'invisible')}
    >
      <TooltipProvider>
        <div class={cleanClass('flex w-full grow flex-col justify-center')}>
          <Card bind:ref={cardRef} class={cleanClass(modalStyles({ size }), className)}>
            <CardHeader class="border-b border-gray-200 px-5 py-3 dark:border-white/10">
              {#if headerChildren}
                {@render headerChildren.children?.()}
              {:else if title}
                <div class="flex items-center justify-between gap-2">
                  {#if typeof icon === 'string'}
                    <Icon {icon} size="1.5rem" aria-hidden />
                  {:else if icon}
                    <Logo variant="icon" size="tiny" />
                  {/if}
                  <CardTitle tag="p" class="text-dark/90 grow text-lg font-semibold">{title}</CardTitle>
                  <CloseButton class="-me-2" onclick={() => onClose?.()} />
                </div>
              {/if}
            </CardHeader>

            <CardBody class={cleanClass('grow px-5', bodyChildren?.class)}>
              {@render bodyChildren?.children?.()}
            </CardBody>

            {#if footerChildren}
              <CardFooter class={cleanClass('border-t border-gray-200 dark:border-white/10', footerChildren.class)}>
                {@render footerChildren.children?.()}
              </CardFooter>
            {/if}
          </Card>
        </div>
      </TooltipProvider>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
{@render children?.()}
