<script lang="ts">
  import '$lib/app.css';
  import { TooltipProvider } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<TooltipProvider>
  {@render children?.()}
</TooltipProvider>
