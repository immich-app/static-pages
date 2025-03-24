<script lang="ts">
  import { Heading } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  const { children }: Props = $props();
</script>

<Heading size="large" tag="h3" class="pt-4 pb-2">
  {@render children()}
</Heading>
