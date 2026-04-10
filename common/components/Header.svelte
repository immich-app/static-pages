<script lang="ts">
  import { page } from '$app/state';
  import type { HeaderItem } from '$common/types';
  import {
    Button,
    commandPaletteManager,
    CommandPaletteButton,
    HStack,
    Icon,
    IconButton,
    isExternalLink,
    Logo,
    Text,
    ThemeSwitcher,
  } from '@immich/ui';
  import { mdiMagnify, mdiMenu, mdiOpenInNew } from '@mdi/js';

  type Props = {
    items?: HeaderItem[];
    onToggleSidebar?: () => void;
  };

  const isActive = (path: string, options?: { prefix?: boolean }) =>
    path === page.url.pathname || (options?.prefix && page.url.pathname.startsWith(path));

  let { items = [], onToggleSidebar }: Props = $props();
</script>

<nav class="w-full flex items-center justify-between md:gap-2 p-2">
  <div class="flex gap-2 place-items-center">
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
      <Logo variant="inline" class="hidden sm:block" />
      <Logo variant="logo" class="sm:hidden" />
    </a>
  </div>

  <HStack gap={1}>
    {#each items as item (item.href)}
      <Button
        class={item.show === 'always' ? '' : 'hidden md:flex'}
        href={item.href}
        shape="round"
        variant={item.variant ?? 'ghost'}
        leadingIcon={(item.icon as { path?: string })?.path ?? (item.icon as string)}
        trailingIcon={isExternalLink(item.href) ? mdiOpenInNew : undefined}
        color={item.color ?? (isActive(item.href) ? 'primary' : 'secondary')}>{item.title}</Button
      >
    {/each}
    <CommandPaletteButton />
    <ThemeSwitcher />
  </HStack>
</nav>
