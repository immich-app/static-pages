<script lang="ts">
  import { page } from '$app/state';
  import '$lib/app.css';
  import ErrorLayout from '$lib/components/ErrorLayout.svelte';
  import { getOpenApiProviders } from '$lib/services/open-api';
  import {
    commandPaletteManager,
    CommandPaletteProvider,
    getSiteProviders,
    ScreencastOverlay,
    TooltipProvider,
  } from '@immich/ui';
  import { type Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  let { children }: Props = $props();

  commandPaletteManager.enable();
</script>

<CommandPaletteProvider providers={[...getOpenApiProviders(), ...getSiteProviders()]} />
<ScreencastOverlay />

<TooltipProvider>
  {#if page.data.error}
    <ErrorLayout error={page.data.error}></ErrorLayout>
  {:else}
    {@render children?.()}
  {/if}
</TooltipProvider>
