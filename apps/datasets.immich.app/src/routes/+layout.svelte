<script lang="ts">
  import '$lib/app.css';
  import { initializeTheme, TooltipProvider } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  let { children }: Props = $props();

  initializeTheme();
</script>

<TooltipProvider>
  {@render children?.()}
</TooltipProvider>
