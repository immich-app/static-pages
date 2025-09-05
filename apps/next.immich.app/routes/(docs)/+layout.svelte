<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { Constants } from '$lib';
  import Header from '$lib/components/Header.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import type { HeaderItem } from '$lib/types';
  import { AppShell, AppShellHeader, AppShellSidebar, NavbarItem } from '@immich/ui';
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
    { title: 'Docs', href: Constants.Sites.Docs },
    { title: 'API', href: Constants.Sites.Api },
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
    {@render children?.()}
  </PageContent>
</AppShell>
