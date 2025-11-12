<script lang="ts">
  import type { State } from '$lib/services/open-api.d';
  import { tv } from 'tailwind-variants';

  type Props = {
    state: State;
    short?: boolean;
  };

  const { state, short }: Props = $props();

  const styles = tv({
    base: 'text-dark rounded-lg px-2 py-0.5 text-sm',
    variants: {
      state: {
        Stable: 'text-dark bg-green-200 dark:bg-green-900',
        Beta: 'text-dark bg-yellow-200 dark:bg-yellow-900 ',
        Deprecated: 'bg-red-200 dark:bg-red-900 ',
        Alpha: 'bg-purple-200 dark:bg-purple-900 ',
        Internal: 'bg-gray-300 dark:bg-gray-600 ',
      },
    },
  });

  const getTitle = (state: State) => {
    switch (state) {
      case 'Stable':
        return 'Considered stable and ready for general use.';
      case 'Beta':
        return 'Considered unstable and may change in future releases.';
      case 'Deprecated':
        return 'Deprecated and should not be used in new implementations. It will likely be removed in a future release.';
      case 'Alpha':
        return 'Considered unstable and subject to significant changes.';
      case 'Internal':
        return 'For internal use only and may change at any time without notice.';
      default:
        return 'Unknown state';
    }
  };
</script>

<span class={styles({ state })} title={getTitle(state)}>
  {#if !short}Status:
  {/if}{state}</span
>
