<script lang="ts">
  import PageContent from '$common/components/PageContent.svelte';
  import { siteMetadata } from '$lib';
  import '$lib/app.css';
  import {
    AppShell,
    AppShellHeader,
    Button,
    HStack,
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
    <AppShellHeader>
      <nav class="flex items-center justify-between p-2 md:gap-2">
        <a href="/">
          <Logo variant="inline" />
        </a>

        <HStack gap={1}>
          <Button color="secondary" href={siteMetadata.editUrl} leadingIcon={mdiPencil}>Edit this page</Button>
          <ThemeSwitcher />
        </HStack>
      </nav>
    </AppShellHeader>

    <PageContent class="mx-auto w-full max-w-(--breakpoint-lg)">
      {@render children?.()}
    </PageContent>
  </AppShell>
</TooltipProvider>
