<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import '$lib/app.css';
  import PageContent from '$lib/components/PageContent.svelte';
  import {
    AppShell,
    AppShellHeader,
    AppShellSidebar,
    Button,
    Constants,
    IconButton,
    initializeTheme,
    Logo,
    NavbarItem,
    ThemeSwitcher,
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
  import { siGithub } from 'simple-icons';
  import { onMount, type Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';

  type Props = {
    children?: Snippet;
    center?: boolean;
  };

  const { children }: Props = $props();

  initializeTheme({ selector: 'body' });

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

<AppShell>
  <AppShellHeader>
    <div>
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
          <Button trailingIcon={mdiOpenInNew} href={Constants.Sites.Store} color="secondary" variant="ghost" external>
            Merch
          </Button>
          <Button trailingIcon={mdiOpenInNew} href={Constants.Sites.Docs} color="secondary" variant="ghost" external>
            Docs
          </Button>
          <Button
            leadingIcon={siGithub.path}
            trailingIcon={mdiOpenInNew}
            href={Constants.Socials.Github}
            color="secondary"
            variant="ghost"
            external
          >
            GitHub
          </Button>
        </div>
        <div class="flex place-items-center gap-2 justify-end">
          <Button href={Constants.Sites.Buy} color="primary" external>Buy Immich</Button>
          <ThemeSwitcher />
        </div>
      </nav>
    </div>
  </AppShellHeader>

  <AppShellSidebar bind:open>
    <div class="my-4 me-4">
      <NavbarItem title="Documentation" href={Constants.Sites.Docs} external icon={mdiScriptTextOutline} />
      <NavbarItem title="Blog" href="/blog" icon={mdiPostOutline} />
      <NavbarItem title="Roadmap" href="/roadmap" icon={mdiChartGantt} />
      <NavbarItem title="Download" href="/download" icon={mdiDownload} />
      <NavbarItem title="Merch" href={Constants.Sites.Store} external icon={mdiShoppingOutline} />
      <NavbarItem title="Github" href={Constants.Socials.Github} external icon={siGithub.path} />
    </div>
  </AppShellSidebar>

  <PageContent class="mx-auto w-full max-w-(--breakpoint-lg)">
    {@render children?.()}
  </PageContent>
</AppShell>
