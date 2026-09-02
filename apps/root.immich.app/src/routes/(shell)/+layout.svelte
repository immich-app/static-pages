<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { posts } from '$lib';
  import '$lib/app.css';
  import {
    AnnouncementBanner,
    AppShell,
    AppShellHeader,
    AppShellSidebar,
    Button,
    CommandPaletteButton,
    Constants,
    IconButton,
    Link,
    Logo,
    NavbarItem,
    ScreencastOverlay,
    SiteFooter,
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
  import { type Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';

  type Props = {
    children?: Snippet;
  };

  const { children }: Props = $props();

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

  const featuredPost = posts.find((post) => post.featured);
</script>

<ScreencastOverlay />

<TooltipProvider>
  <AppShell>
    <AppShellHeader class="block">
      <AnnouncementBanner center size="small" until={DateTime.fromObject({ year: 2026, month: 9, day: 30 })}>
        Try our new tool: <Link href="/docker-compose-builder">Docker Compose Builder</Link>
      </AnnouncementBanner>
      <div class="w-full">
        {#if !page.url.pathname.startsWith('/blog') && featuredPost}
          <AnnouncementBanner until={featuredPost.publishedAt.plus({ week: 1 })}>
            {#snippet content()}
              <div class="flex items-center justify-center gap-1">
                Read our latest post:
                <Text color="primary">
                  <Link href={featuredPost.url}>{featuredPost.title}</Link>
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
            <CommandPaletteButton />
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

    <div class="mx-auto flex h-full flex-col">
      {@render children?.()}
      <SiteFooter />
    </div>
  </AppShell>
</TooltipProvider>
