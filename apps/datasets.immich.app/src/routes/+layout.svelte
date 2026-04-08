<script lang="ts">
  import '$lib/app.css';
  import { themeManager, TooltipProvider } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  let { children }: Props = $props();

  themeManager.initialize();
</script>

<TooltipProvider>
  {@render children?.()}
</TooltipProvider>
