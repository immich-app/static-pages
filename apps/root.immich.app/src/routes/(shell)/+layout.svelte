<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { posts } from '#lib';
  import '#lib/app.css';
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

  const futoSymbol =
    'M12.0005 0C18.6278 8.58041e-05 24 5.373 24 12.0005C23.9998 18.6279 18.6277 23.9999 12.0005 24C5.37322 24 0.000172714 18.6279 0 12.0005C0 5.37295 5.37312 0 12.0005 0ZM12.1187 6.35112C11.3541 6.35116 10.7382 6.96614 9.50741 8.1969L8.50466 9.20038C7.27413 10.4309 6.65877 11.0462 6.65873 11.8108C6.65873 12.5755 7.27384 13.1914 8.50466 14.4222L9.50741 15.4247C10.7382 16.6555 11.3541 17.2714 12.1187 17.2715C12.8833 17.2715 13.4992 16.6555 14.73 15.4247L15.7327 14.4222C16.9636 13.1914 17.5787 12.5755 17.5787 11.8108C17.5786 11.0462 16.9634 10.431 15.7327 9.20038L14.73 8.1969C13.4992 6.9661 12.8833 6.35112 12.1187 6.35112Z';

  const sidebar = new MediaQuery(`max-width: 1023px`);
  let isMobile = $derived(sidebar.current);
  let isOpen = $state(false);
  let open = $derived(isMobile && isOpen);

  beforeNavigate(({ shallow, type }) => {
    if (shallow && type === 'goto') {
      return;
    }

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
              class="lg:hidden"
            />
            <a href="/" class="flex gap-2 text-4xl">
              <Logo variant="inline" class="hidden sm:block" />
              <Logo variant="logo" class="sm:hidden" />
            </a>
          </div>

          <div class="hidden place-items-center gap-1 lg:flex">
            <Button href="/blog" variant="ghost" color={withActiveColor('/blog')}>Blog</Button>

            <Button href="/roadmap" variant="ghost" color={withActiveColor('/roadmap')}>Roadmap</Button>

            <Button
              leadingIcon={futoSymbol}
              trailingIcon={mdiOpenInNew}
              href="https://futo.tech"
              color="secondary"
              variant="ghost">FUTO</Button
            >

            <Button trailingIcon={mdiOpenInNew} href={Constants.Sites.Store} color="secondary" variant="ghost"
              >Merch</Button
            >

            <Button trailingIcon={mdiOpenInNew} href={Constants.Sites.Docs} color="secondary" variant="ghost"
              >Docs</Button
            >

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
        <NavbarItem title="FUTO" href="https://futo.tech" icon={futoSymbol} />
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
