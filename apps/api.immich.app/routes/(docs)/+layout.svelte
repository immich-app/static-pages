<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { getOpenApi } from '$lib/api/services/open-api';
  import Header from '$lib/components/Header.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import { ApiPage } from '$lib/utils/api';
  import { getIcon } from '$lib/utils/icons';
  import { AppShell, AppShellHeader, AppShellSidebar, NavbarGroup, NavbarItem } from '@immich/ui';
  import {
    mdiApi,
    mdiCompass,
    mdiCompassOutline,
    mdiCube,
    mdiCubeOutline,
    mdiLock,
    mdiLockOutline,
    mdiNote,
    mdiNoteOutline,
    mdiSecurity,
    mdiTagMultiple,
    mdiTagMultipleOutline,
  } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';

  type Props = {
    children?: Snippet;
  };

  const { children }: Props = $props();

  const { tags } = getOpenApi();

  const sidebar = new MediaQuery(`min-width: 850px`);
  let open = $derived(sidebar.current);

  beforeNavigate(() => {
    if (!sidebar.current) {
      open = false;
    }
  });
</script>

<AppShell>
  <AppShellHeader>
    <Header onToggleSidebar={() => (open = !open)} />
  </AppShellHeader>

  <AppShellSidebar bind:open class="border-e">
    <div class="mt-8 pe-6 flex flex-col gap-4">
      <div>
        <NavbarItem title="Introduction" href={ApiPage.Introduction} icon={mdiNoteOutline} activeIcon={mdiNote} />
        <NavbarItem
          title="Getting started"
          href={ApiPage.GettingStarted}
          icon={mdiCompassOutline}
          activeIcon={mdiCompass}
        />
        <NavbarItem title="Authentication" href={ApiPage.Authentication} icon={mdiSecurity} />
        <NavbarItem title="Permissions" href={ApiPage.Permissions} icon={mdiLockOutline} activeIcon={mdiLock} />
        <NavbarItem title="SDK" href={ApiPage.Sdk} icon={mdiCubeOutline} activeIcon={mdiCube} />
        <NavbarItem
          title="Endpoints"
          href={ApiPage.Endpoints}
          icon={mdiApi}
          active={page.url.pathname === ApiPage.Endpoints}
        />
        <NavbarItem
          title="Models"
          href={ApiPage.Models}
          icon={mdiTagMultipleOutline}
          activeIcon={mdiTagMultiple}
          active={page.url.pathname === ApiPage.Models}
        />
      </div>
      <div>
        <NavbarGroup title="Endpoints" />
        {#each tags as tag (tag.href)}
          <NavbarItem title={tag.name} href={tag.href} icon={getIcon(tag.name)} variant="compact" />
        {/each}
      </div>
    </div>
  </AppShellSidebar>

  <PageContent class="mx-auto w-full max-w-(--breakpoint-lg)">
    {@render children?.()}
  </PageContent>
</AppShell>
