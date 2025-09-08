<script lang="ts">
  import { page } from '$app/state';
  import { commandPaletteManager } from '$lib/services/command-palette-manager.svelte';
  import type { HeaderItem } from '$lib/types';
  import { Button, HStack, IconButton, Input, Logo, ThemeSwitcher } from '@immich/ui';
  import { mdiMagnify, mdiMenu, mdiOpenInNew, mdiSlashForwardBox } from '@mdi/js';

  type Props = {
    items?: HeaderItem[];
    onToggleSidebar?: () => void;
  };

  const isActive = (path: string, options?: { prefix?: boolean }) =>
    path === page.url.pathname || (options?.prefix && page.url.pathname.startsWith(path));

  let { items = [], onToggleSidebar }: Props = $props();
</script>

<nav class="flex items-center justify-between md:gap-2 p-2">
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
      <Logo variant="inline" />
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
        trailingIcon={item.external ? mdiOpenInNew : undefined}
        color={item.color ?? (isActive(item.href) ? 'primary' : 'secondary')}
        target={item.external ? '_blank' : undefined}
        rel={item.external ? 'noopener noreferrer' : undefined}>{item.title}</Button
      >
    {/each}
    {#if commandPaletteManager.isEnabled}
      <div class="hidden lg:flex max-w-40 place-items-center p-1">
        <Input
          onfocus={() => commandPaletteManager.open()}
          leadingIcon={mdiMagnify}
          placeholder="Search..."
          class="py-2 px-2 rounded-full bg-subtle! border"
          trailingIcon={mdiSlashForwardBox}
        />
      </div>
      <IconButton
        icon={mdiMagnify}
        shape="round"
        variant="ghost"
        color="secondary"
        aria-label="Search"
        class="lg:hidden"
        onclick={() => commandPaletteManager.open()}
      />
    {/if}
    <ThemeSwitcher />
  </HStack>
</nav>
