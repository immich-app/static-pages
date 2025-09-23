<script lang="ts">
  import { Code } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  let { children }: Props = $props();
</script>

<Code variant="filled" class="px-2 py-1" color="primary">{@render children?.()}</Code>
