<script lang="ts">
  import { getDocsProviders } from '$lib/constants.js';
  import {
    commandPaletteManager,
    CommandPaletteProvider,
    getSiteProviders,
    ScreencastOverlay,
    toastManager,
    TooltipProvider,
  } from '@immich/ui';
  import '@immich/ui/theme/default.css';
  import '$lib/app.css';

  let { children } = $props();

  toastManager.setOptions({ class: 'top-[58px]' });

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
