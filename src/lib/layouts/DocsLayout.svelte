<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import { sidebarManager } from '$lib/managers/sidebar-manager.svelte';
  import { AppShell, AppShellHeader, AppShellSidebar, NavbarGroup, NavbarItem } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import type { HeaderItem } from '../types';

  type Props = {
    children?: Snippet;
    sidebar?: Snippet;
  };

  const { children, sidebar }: Props = $props();
  const items: HeaderItem[] = [
    { title: 'Download', href: '/download', variant: 'filled', color: 'primary' },
    { title: 'Features', href: '/features' },
    { title: 'Roadmap', href: '/roadmap' },
    { title: 'Docs', href: 'https://immich.app/' },
    { title: 'API', href: '/api' },
    // { title: 'Blog', href: '/blog' },
    // { title: 'FAQs', href: '/faqs' },
  ];
</script>

<AppShell>
  <AppShellHeader>
    <Header {items} />
  </AppShellHeader>
  <AppShellSidebar bind:open={sidebarManager.isOpen}>
    {#if sidebar}
      {@render sidebar?.()}
    {:else}
      <div class="py-4">
        <NavbarGroup title="Links" />
        {#each items as item}
          <NavbarItem title={item.title} href={item.href} variant="compact" />
        {/each}
      </div>
    {/if}
  </AppShellSidebar>

  {@render children?.()}
</AppShell>
