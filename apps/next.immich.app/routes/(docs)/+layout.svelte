<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import PageContent from '$lib/components/PageContent.svelte';
  import {
    AppShell,
    AppShellHeader,
    AppShellSidebar,
    Button,
    Constants,
    IconButton,
    Logo,
    NavbarItem,
    ThemeSwitcher,
  } from '@immich/ui';
  import {
    mdiChartGantt,
    mdiKeyOutline,
    mdiMenu,
    mdiOpenInNew,
    mdiPartyPopper,
    mdiScriptTextOutline,
    mdiShoppingOutline,
  } from '@mdi/js';
  import { siGithub } from 'simple-icons';
  import { type Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';

  type Props = {
    children?: Snippet;
    center?: boolean;
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
          <a href={resolve('/')} class="flex gap-2 text-4xl">
            <Logo variant="inline" />
          </a>
        </div>

        <div class="hidden lg:flex gap-1 place-items-center">
          <Button href={Constants.Sites.Buy} color="primary" external>Buy Immich</Button>
          <Button href="/features" variant="ghost" color={withActiveColor('/features')}>Features</Button>
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
          <Button href={Constants.Sites.Buy} color="primary" external class="lg:hidden">Buy Immich</Button>
          <ThemeSwitcher />
        </div>
      </nav>
    </div>
  </AppShellHeader>

  <AppShellSidebar bind:open>
    <div class="my-4">
      <NavbarItem title="Documentation" href={Constants.Sites.Docs} external icon={mdiScriptTextOutline} />
      <NavbarItem title="Features" href="/features" icon={mdiPartyPopper} />
      <NavbarItem title="Project Roadmap" href="/roadmap" icon={mdiChartGantt} />
      <NavbarItem title="View on Github" href={Constants.Socials.Github} external icon={siGithub.path} />
      <NavbarItem title="Buy Immich" href={Constants.Sites.Buy} external icon={mdiKeyOutline} />
      <NavbarItem title="Buy Merch" href={Constants.Sites.Store} external icon={mdiShoppingOutline} />
    </div>
  </AppShellSidebar>

  <PageContent class="mx-auto w-full max-w-(--breakpoint-lg)">
    {@render children?.()}
  </PageContent>
</AppShell>
