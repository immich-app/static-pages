<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import '$lib/app.css';
  import { getSearchProvider } from '$lib/search';
  import {
    commandPaletteManager,
    CommandPaletteProvider,
    getSiteProviders,
    ScreencastOverlay,
    TooltipProvider,
  } from '@immich/ui';
  import { onMount, type Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  type Props = {
    children?: Snippet;
    data?: LayoutData;
  };

  const { data, children }: Props = $props();

  let pathname = '';
  onMount(() => {
    pathname = page.url.pathname;
  });

  beforeNavigate(() => {
    const newPathname = $state.snapshot(page.url.pathname);
    pathname = newPathname;
  });

  afterNavigate(() => {
    const newPathname = $state.snapshot(page.url.pathname);
    if (pathname === newPathname) {
      return;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  });

  commandPaletteManager.enable();
</script>

<CommandPaletteProvider providers={[getSearchProvider(data?.docs ?? []), ...getSiteProviders()]} />

<ScreencastOverlay />

<TooltipProvider>
  {@render children?.()}
</TooltipProvider>
