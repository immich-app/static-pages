<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import PageContent from '$common/components/PageContent.svelte';
  import '$lib/app.css';
  import {
    AnnouncementBanner,
    AppShell,
    AppShellHeader,
    AppShellSidebar,
    Button,
    Constants,
    IconButton,
    initializeTheme,
    Link,
    Logo,
    NavbarItem,
    Text,
    ThemeSwitcher,
    TooltipProvider,
  } from '@immich/ui';
  import {
    mdiChartGantt,
    mdiDownload,
    mdiMenu,
    mdiOpenInNew,
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
</script>

<TooltipProvider>
  <AppShell>
    <AppShellHeader>
      <div class="w-full">
        {#if !page.url.pathname.startsWith('/blog')}
          <AnnouncementBanner until={DateTime.fromObject({ year: 2026, month: 2, day: 7 })}>
            {#snippet content()}
              <div class="flex justify-center">
                <Text color="secondary" size="small">
                  Read our <Link href="/blog/2026-january-recap">January recap</Link> &dash; roadmap changes, developer updates,
                  and more!
                </Text>
              </div>
            {/snippet}
          </AnnouncementBanner>
        {/if}
        <nav class="flex grid-cols-[1fr_auto_1fr] justify-between p-2 lg:grid lg:gap-2">
          <div class="flex place-items-center gap-2">
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
              <Logo variant="inline" class="hidden sm:block" />
              <Logo variant="logo" class="sm:hidden" />
            </a>
          </div>

          <div class="hidden place-items-center gap-1 lg:flex">
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
          <div class="flex place-items-center justify-end gap-2">
            <Button href={Constants.Sites.Buy} color="primary" size="small">Buy Immich</Button>
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
</TooltipProvider>
