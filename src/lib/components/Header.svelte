<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { sidebarManager } from '$lib/managers/sidebar-manager.svelte';
  import type { HeaderItem } from '$lib/types';
  import { Button, HStack, IconButton, Logo, ThemeSwitcher } from '@immich/ui';
  import { mdiMenu } from '@mdi/js';
  import type { Snippet } from 'svelte';

  type Props = {
    items: HeaderItem[];
    children?: Snippet;
  };

  const isActive = (path: string, options?: { prefix?: boolean }) =>
    path === page.url.pathname || (options?.prefix && page.url.pathname.startsWith(path));

  let { items, children }: Props = $props();

  let menuOpen = $state(false);
  afterNavigate(() => {
    menuOpen = false;
  });
</script>

<nav class="flex items-center justify-between md:gap-2 p-2">
  <div class="flex items-center">
    <IconButton
      size="large"
      shape="round"
      color="secondary"
      variant="ghost"
      class="md:hidden"
      icon={mdiMenu}
      aria-label="Open menu"
      onclick={() => sidebarManager.toggle()}
    />
    <a href="/" class="flex gap-2 text-4xl">
      <Logo variant="inline" />
    </a>
  </div>
  {@render children?.()}

  <HStack gap={0}>
    {#each items as item}
      <Button
        class="hidden md:flex"
        href={item.href}
        shape="round"
        variant={item.variant ?? 'ghost'}
        color={(item.color ?? isActive(item.href)) ? 'primary' : 'secondary'}>{item.title}</Button
      >
    {/each}
    <ThemeSwitcher size="large" />
    {#if items.length > 0}
      <span class="md:hidden"> </span>
    {/if}
  </HStack>
</nav>
