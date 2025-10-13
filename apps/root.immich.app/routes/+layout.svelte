<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import '$lib/app.css';
  import { Posts } from '$lib/blog';
  import PageContent from '$lib/components/PageContent.svelte';
  import {
    AppShell,
    AppShellHeader,
    AppShellSidebar,
    Button,
    Constants,
    Icon,
    IconButton,
    initializeTheme,
    Link,
    Logo,
    NavbarItem,
    Text,
    ThemeSwitcher,
  } from '@immich/ui';
  import {
    mdiChartGantt,
    mdiDownload,
    mdiMenu,
    mdiOpenInNew,
    mdiPartyPopper,
    mdiPostOutline,
    mdiScriptTextOutline,
    mdiShoppingOutline,
  } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { siGithub } from 'simple-icons';
  import { onMount, type Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';

  type Props = {
    children?: Snippet;
    center?: boolean;
  };

  const { children }: Props = $props();

  initializeTheme({ selector: 'html', lightClass: 'light', darkClass: 'dark' });

  let pathname = '';
  onMount(() => {
    pathname = page.url.pathname;
  });

  beforeNavigate(() => {
    const newPathname = $state.snapshot(page.url.pathname);
    pathname = newPathname;
  });

  afterNavigate(() => {
    const newPathname = $state.snapshot(page.url.pathname);
    if (pathname === newPathname) {
      return;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  });

  const sidebar = new MediaQuery(`max-width: 850px`);
  let isMobile = $derived(sidebar.current);
  let isOpen = $state(false);
  let open = $derived(isMobile && isOpen);

  beforeNavigate(() => {
    isOpen = false;
  });

  const withActiveColor = (path: string) => {
    const active = path === page.url.pathname || page.url.pathname.startsWith(path);
    return active ? 'primary' : 'secondary';
  };

  const expiresAt = DateTime.fromObject({ year: 2025, month: 10, day: 15 });
  let isVisible = $derived(DateTime.now().toMillis() < expiresAt.toMillis());
</script>

<AppShell>
  <AppShellHeader>
    <div>
      {#if isVisible}
        <div class="bg-primary/15 dark:bg-subtle px-4 py-2 flex items-center justify-around w-full">
          <div class="flex gap-2 items-center place-items-center">
            <Icon icon={mdiPartyPopper} class="text-primary" size="1.5rem" />
            <Text color="secondary" size="small">
              It's official &mdash; Immich is stable! Read the <Link href={Posts.StableRelease.url}>announcement</Link>
            </Text>
          </div>
        </div>
      {/if}
      <nav class="flex justify-between lg:grid grid-cols-[1fr_auto_1fr] lg:gap-2 p-2">
        <div class="flex gap-2 place-items-center">
          <IconButton
            shape="round"
            color="secondary"
            variant="ghost"
            size="medium"
            aria-label="Main menu"
            icon={mdiMenu}
            onclick={() => (isOpen = !isOpen)}
            class="md:hidden"
          />
          <a href="/" class="flex gap-2 text-4xl">
            <Logo variant="inline" />
          </a>
        </div>

        <div class="hidden lg:flex gap-1 place-items-center">
          <Button href="/blog" variant="ghost" color={withActiveColor('/blog')}>Blog</Button>
          <Button href="/roadmap" variant="ghost" color={withActiveColor('/roadmap')}>Roadmap</Button>
          <Button trailingIcon={mdiOpenInNew} href={Constants.Sites.Store} color="secondary" variant="ghost">
            Merch
          </Button>
          <Button trailingIcon={mdiOpenInNew} href={Constants.Sites.Docs} color="secondary" variant="ghost">
            Docs
          </Button>
          <Button
            leadingIcon={siGithub.path}
            trailingIcon={mdiOpenInNew}
            href={Constants.Socials.Github}
            color="secondary"
            variant="ghost"
          >
            GitHub
          </Button>
        </div>
        <div class="flex place-items-center gap-2 justify-end">
          <Button href={Constants.Sites.Buy} color="primary">Buy Immich</Button>
          <ThemeSwitcher />
        </div>
      </nav>
    </div>
  </AppShellHeader>

  <AppShellSidebar bind:open>
    <div class="my-4 me-4">
      <NavbarItem title="Documentation" href={Constants.Sites.Docs} icon={mdiScriptTextOutline} />
      <NavbarItem title="Blog" href="/blog" icon={mdiPostOutline} />
      <NavbarItem title="Roadmap" href="/roadmap" icon={mdiChartGantt} />
      <NavbarItem title="Download" href="/download" icon={mdiDownload} />
      <NavbarItem title="Merch" href={Constants.Sites.Store} icon={mdiShoppingOutline} />
      <NavbarItem title="Github" href={Constants.Socials.Github} icon={siGithub.path} />
    </div>
  </AppShellSidebar>

  <PageContent class="mx-auto w-full max-w-(--breakpoint-lg)">
    {@render children?.()}
  </PageContent>
</AppShell>
