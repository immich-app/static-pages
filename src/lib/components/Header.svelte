<script lang="ts">
  import { page } from '$app/state';
  import type { HeaderItem } from '$lib/types';
  import { Button, HStack, IconButton, Logo, ThemeSwitcher } from '@immich/ui';
  import { mdiMenu } from '@mdi/js';
  import type { Snippet } from 'svelte';

  type Props = {
    items?: HeaderItem[];
    children?: Snippet;
    onToggleSidebar?: () => void;
  };

  const isActive = (path: string, options?: { prefix?: boolean }) =>
    path === page.url.pathname || (options?.prefix && page.url.pathname.startsWith(path));

  let { items = [], children, onToggleSidebar }: Props = $props();
</script>

<nav class="flex items-center justify-between md:gap-2 p-2">
  {#if onToggleSidebar}
    <IconButton
      shape="round"
      color="secondary"
      variant="ghost"
      size="medium"
      aria-label="Main menu"
      icon={mdiMenu}
      onclick={() => onToggleSidebar()}
      class="md:hidden"
    />
  {/if}
  <a href="/" class="flex gap-2 text-4xl">
    <Logo variant="inline" />
  </a>
  {@render children?.()}

  <HStack gap={0}>
    {#each items as item (item.href)}
      <Button
        class={item.show === 'always' ? '' : 'hidden md:flex'}
        href={item.href}
        shape="round"
        variant={item.variant ?? 'ghost'}
        color={item.color ?? (isActive(item.href) ? 'primary' : 'secondary')}>{item.title}</Button
      >
    {/each}
    <ThemeSwitcher />
  </HStack>
</nav>
