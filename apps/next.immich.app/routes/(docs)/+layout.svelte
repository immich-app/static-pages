<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import Header from '$lib/components/Header.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import type { HeaderItem } from '$lib/types';
  import { AppShell, AppShellHeader, AppShellSidebar, Heading, NavbarItem, Stack, Text } from '@immich/ui';
  import { type Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';

  type Props = {
    children?: Snippet;
  };

  const { children }: Props = $props();

  const sidebar = new MediaQuery(`max-width: 850px`);
  let isMobile = $derived(sidebar.current);
  let isOpen = $state(false);
  let open = $derived(isMobile && isOpen);

  beforeNavigate(() => {
    isOpen = false;
  });

  const items: HeaderItem[] = [
    { title: 'Download', href: '/download', variant: 'filled', color: 'primary' },
    { title: 'Features', href: '/features' },
    { title: 'Roadmap', href: '/roadmap' },
    { title: 'Docs', href: 'https://immich.app/' },
    { title: 'API', href: 'https://api.immich.app/' },
  ];
</script>

<AppShell>
  <AppShellHeader>
    <Header onToggleSidebar={() => (isOpen = !isOpen)} {items} />
  </AppShellHeader>

  <AppShellSidebar bind:open>
    <div class="my-4">
      {#each items as item (item.href)}
        <NavbarItem title={item.title} href={item.href} />
      {/each}
    </div>
  </AppShellSidebar>

  <PageContent class="mx-auto w-full max-w-(--breakpoint-lg)">
    {@render children?.()};
    <Stack>
      <Heading size="title" tag="h1">About</Heading>
      <Text>Meet the team</Text>
    </Stack>
  </PageContent>
</AppShell>
