<script lang="ts">
  import '$lib/app.css';
  import { initializeTheme } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  let { children }: Props = $props();

  initializeTheme();
</script>

{@render children?.()}
