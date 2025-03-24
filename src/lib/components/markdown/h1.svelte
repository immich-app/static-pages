<script lang="ts">
  import { Heading } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  const { children }: Props = $props();
</script>

<Heading size="title" tag="h1" class="pt-6 pb-2">
  {@render children()}
</Heading>
