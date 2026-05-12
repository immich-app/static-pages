<script lang="ts">
  import '$lib/app.css';
  import { getDocsProviders } from '$lib/constants.js';
  import {
    commandPaletteManager,
    CommandPaletteProvider,
    getSiteProviders,
    globalManager,
    ScreencastOverlay,
    toastManager,
    TooltipProvider,
  } from '@immich/ui';
  import '@immich/ui/theme/default.css';

  let { children } = $props();

  toastManager.setOptions({ class: 'top-[58px]' });

  globalManager.setSiteMetadata({
    title: 'Immich UI',
    description: 'A Svelte component library for Immich',
  });
  commandPaletteManager.enable();
  commandPaletteManager.setTranslations({
    command_palette_prompt_default: 'Quickly find components, links, and commands',
  });
</script>

<CommandPaletteProvider providers={[...getDocsProviders(), ...getSiteProviders()]} />
<ScreencastOverlay />

<TooltipProvider>
  {@render children?.()}
</TooltipProvider>
