<script lang="ts">
  import { page } from '$app/state';
  import type { HeaderItem } from '$common/types';
  import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardTitle,
    CommandPaletteButton,
    HStack,
    IconButton,
    isExternalLink,
    Logo,
    ThemeSwitcher,
  } from '@immich/ui';
  import { mdiInformationOutline, mdiMenu, mdiOpenInNew } from '@mdi/js';
  import { fade } from 'svelte/transition';
  type Props = {
    items?: HeaderItem[];
    onToggleSidebar?: () => void;
  };

  const isActive = (path: string, options?: { prefix?: boolean }) =>
    path === page.url.pathname || (options?.prefix && page.url.pathname.startsWith(path));
  let displayInstructions = $state(false);
  let { items = [], onToggleSidebar }: Props = $props();

  let onPetsPage = $derived(isActive('/projects/pets'));
</script>

{#if onPetsPage && displayInstructions}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    transition:fade|global={{ duration: 150 }}
  >
    <Card color="secondary" class="w-full max-w-lg">
      <CardHeader>
        <div class="flex justify-between">
          <CardTitle>Instructions</CardTitle>
        </div>
      </CardHeader>
      <CardBody>hi</CardBody>
      <CardFooter>
        <Button color="primary" onclick={() => (displayInstructions = false)}>Ok</Button>
      </CardFooter>
    </Card>
  </div>
{/if}
<nav class="grid w-full grid-cols-[1fr_auto_1fr] items-center p-2 md:gap-4">
  <div class="flex place-items-center gap-2 justify-self-start">
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
  <div class="justify-self-center whitespace-nowrap px-4"></div>
  <HStack gap={1} class="justify-self-end px-2">
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
    {#if onPetsPage}
      <IconButton
        shape="round"
        color="secondary"
        variant="ghost"
        aria-label="Display Instructions"
        icon={mdiInformationOutline}
        onclick={() => (displayInstructions = true)}
      />
    {/if}
  </HStack>
</nav>
