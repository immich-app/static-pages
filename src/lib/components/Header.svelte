<script lang="ts">
  import { page } from '$app/state';
  import type { HeaderItem } from '$lib/types';
  import { Button, HStack, IconButton, Logo, syncToDom, theme, Theme } from '@immich/ui';
  import { mdiWeatherNight, mdiWeatherSunny } from '@mdi/js';

  type Props = {
    items: HeaderItem[];
  };

  const isActive = (path: string, options?: { prefix?: boolean }) =>
    path === page.url.pathname || (options?.prefix && page.url.pathname.startsWith(path));

  let { items }: Props = $props();

  const handleToggleTheme = () => {
    theme.value = theme.value === Theme.Dark ? Theme.Light : Theme.Dark;
  };

  const themeIcon = $derived(theme.value === Theme.Light ? mdiWeatherSunny : mdiWeatherNight);

  $effect(() => {
    syncToDom();
  });
</script>

<nav class="flex items-center justify-between gap-2 p-2">
  <a href="/" class="flex gap-2 text-4xl">
    <Logo variant="inline" />
  </a>
  <HStack gap={0}>
    {#each items as item}
      <Button
        href={item.href}
        shape="round"
        variant={item.variant ?? 'ghost'}
        color={(item.color ?? isActive(item.href)) ? 'primary' : 'secondary'}>{item.title}</Button
      >
    {/each}
    <IconButton
      size="large"
      shape="round"
      color="primary"
      variant="ghost"
      icon={themeIcon}
      onclick={handleToggleTheme}
    />
  </HStack>
</nav>
