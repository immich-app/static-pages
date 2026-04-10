<script lang="ts">
  import PageContent from '$common/components/PageContent.svelte';
  import { getCategoryProviders, siteMetadata } from '$lib';
  import '$lib/app.css';
  import {
    AppShell,
    AppShellHeader,
    Button,
    CommandPaletteButton,
    commandPaletteManager,
    CommandPaletteProvider,
    ControlBar,
    ControlBarHeader,
    ControlBarOverflow,
    getSiteProviders,
    Logo,
    ThemeSwitcher,
    TooltipProvider,
  } from '@immich/ui';
  import { mdiPencil } from '@mdi/js';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  const { children }: Props = $props();

  commandPaletteManager.enable();
</script>

<CommandPaletteProvider providers={[...getCategoryProviders(), ...getSiteProviders()]} />

<TooltipProvider>
  <AppShell>
    <AppShellHeader class="w-full">
      <ControlBar variant="ghost" static>
        <ControlBarHeader>
          <a href="/">
            <Logo variant="inline" class="hidden sm:block" />
            <Logo variant="logo" class="sm:hidden" />
          </a>
        </ControlBarHeader>
        <ControlBarOverflow>
          <Button color="secondary" href={siteMetadata.editUrl} leadingIcon={mdiPencil} size="small" shape="round">
            Edit this page
          </Button>
          <CommandPaletteButton />
          <ThemeSwitcher />
        </ControlBarOverflow>
      </ControlBar>
    </AppShellHeader>
    <PageContent class="mx-auto w-full max-w-(--breakpoint-lg)">
      {@render children?.()}
    </PageContent>
  </AppShell>
</TooltipProvider>
