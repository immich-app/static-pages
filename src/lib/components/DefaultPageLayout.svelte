<script lang="ts">
  import '$lib/app.css';
  import Footer from '$lib/components/Footer.svelte';
  import { AppShell, AppShellHeader, IconButton, Logo, syncToDom, theme, Theme } from '@immich/ui';
  import { mdiWeatherNight, mdiWeatherSunny } from '@mdi/js';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();

  const handleToggleTheme = () => {
    theme.value = theme.value === Theme.Dark ? Theme.Light : Theme.Dark;
  };

  const themeIcon = $derived(theme.value === Theme.Light ? mdiWeatherSunny : mdiWeatherNight);

  $effect(() => {
    syncToDom();
  });
</script>

<AppShell>
  <AppShellHeader>
    <nav class="flex items-center justify-between gap-2 p-2">
      <a href="/" class="flex gap-2 text-4xl">
        <Logo variant="inline" />
      </a>
      <IconButton
        size="large"
        shape="round"
        color="primary"
        variant="ghost"
        icon={themeIcon}
        onclick={handleToggleTheme}
      />
    </nav>
  </AppShellHeader>

  <section class="flex flex-col h-full">
    <div class="grow">
      <div class="w-full h-full md:max-w-screen-lg px-4 py-10 sm:px-20 lg:p-10 m-auto">
        {@render children?.()}
      </div>
    </div>
    <Footer />
  </section>
</AppShell>
