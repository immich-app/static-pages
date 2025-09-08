<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { Constants } from '$lib';
  import PageContent from '$lib/components/PageContent.svelte';
  import {
    AppShell,
    AppShellHeader,
    AppShellSidebar,
    Button,
    IconButton,
    Logo,
    NavbarItem,
    ThemeSwitcher,
  } from '@immich/ui';
  import { mdiMenu, mdiOpenInNew } from '@mdi/js';
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
          <a href="/" class="flex gap-2 text-4xl">
            <Logo variant="inline" />
          </a>
        </div>

        <div class="hidden lg:flex gap-1 place-items-center">
          <Button href={Constants.Sites.Buy} color="primary" target="_blank" rel="noopener noreferrer"
            >Buy Immich</Button
          >
          <Button href="/features" variant="ghost" color={withActiveColor('/features')}>Features</Button>
          <Button href="/roadmap" variant="ghost" color={withActiveColor('/roadmap')}>Roadmap</Button>
          <Button
            trailingIcon={mdiOpenInNew}
            href={Constants.Sites.Docs}
            color="secondary"
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
          >
            Docs
          </Button>
          <Button
            leadingIcon={siGithub.path}
            trailingIcon={mdiOpenInNew}
            href={Constants.Socials.Github}
            color={withActiveColor(Constants.Socials.Github) ? 'primary' : 'secondary'}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
          >
            GitHub
          </Button>
        </div>
        <div class="flex place-items-center gap-2 justify-end">
          <Button href={Constants.Sites.Buy} color="primary" target="_blank" rel="noopener noreferrer" class="lg:hidden"
            >Buy Immich</Button
          >
          <ThemeSwitcher />
        </div>
      </nav>
    </div>
  </AppShellHeader>

  <AppShellSidebar bind:open>
    <div class="my-4">
      <NavbarItem title="Buy Immich" href={Constants.Sites.Buy} />
      <NavbarItem title="Features" href="/features" />
      <NavbarItem title="Roadmap" href="/roadmap" />
      <NavbarItem title="Docs" href={Constants.Sites.Docs} />
      <NavbarItem title="API" href={Constants.Sites.Api} />
      <NavbarItem title="GitHub" href={Constants.Socials.Github} />
    </div>
  </AppShellSidebar>

  <PageContent class="mx-auto w-full max-w-(--breakpoint-lg)">
    {@render children?.()}
  </PageContent>
</AppShell>
