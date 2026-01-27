<script lang="ts">
  import PageContent from '$common/components/PageContent.svelte';
  import { siteMetadata } from '$lib';
  import '$lib/app.css';
  import {
    AppShell,
    AppShellHeader,
    Button,
    ControlBar,
    ControlBarHeader,
    ControlBarOverflow,
    initializeTheme,
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

  initializeTheme({ selector: 'html', lightClass: 'light', darkClass: 'dark' });
</script>

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
          <Button color="secondary" href={siteMetadata.editUrl} leadingIcon={mdiPencil}>Edit this page</Button>
          <ThemeSwitcher />
        </ControlBarOverflow>
      </ControlBar>
    </AppShellHeader>
    <PageContent class="mx-auto w-full max-w-(--breakpoint-lg)">
      {@render children?.()}
    </PageContent>
  </AppShell>
</TooltipProvider>
