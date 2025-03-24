<script lang="ts">
  import { Heading } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  const { children }: Props = $props();
</script>

<Heading size="medium" tag="h5" class="pt-4 bt-2">
  {@render children()}
</Heading>
