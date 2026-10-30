<script lang="ts">
  import { zIndex } from '#lib/constants.js';
  import { cleanClass } from '#lib/utilities/internal.js';
  import { Tooltip } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = Tooltip.RootProps & {
    text?: string | null;
    child: Snippet<[{ props: Record<string, unknown> }]>;
    side?: Tooltip.ContentProps['side'];
    class?: ClassValue;
  };

  let { open = $bindable(false), child, text, side, class: className, ...restProps }: Props = $props();
</script>

{#if text}
  <Tooltip.Root bind:open {...restProps}>
    <Tooltip.Trigger {child} />
    <Tooltip.Portal>
      <Tooltip.Content
        {side}
        sideOffset={8}
        interactOutsideBehavior="defer-otherwise-close"
        class={cleanClass(
          'bg-light-800 text-light rounded-lg px-3.5 py-2 text-xs shadow-lg',
          zIndex.Tooltip,
          className,
        )}
      >
        {text}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
{:else}
  {@render child({ props: {} })}
{/if}

<style>
  :global([data-tooltip-content][data-state='delayed-open']),
  :global([data-tooltip-content][data-state='instant-open']) {
    animation: tooltip-enter 150ms ease-out;
  }

  @keyframes tooltip-enter {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
