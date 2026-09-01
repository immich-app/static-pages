<script lang="ts">
  import '$lib/app.css';
  import { TooltipProvider } from '@immich/ui';

  let { children } = $props();
</script>

<TooltipProvider>
  {@render children()}
</TooltipProvider>
