<script lang="ts">
  import { page } from '$app/state';
  import Header from '$lib/components/Header.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import { getOpenApi } from '$lib/services/open-api';
  import { getIcon } from '$lib/utils/icons';
  import { AppShell, AppShellHeader, AppShellSidebar, NavbarGroup, NavbarItem } from '@immich/ui';
  import {
    mdiApi,
    mdiCompass,
    mdiCompassOutline,
    mdiCube,
    mdiCubeOutline,
    mdiLightningBolt,
    mdiLightningBoltOutline,
    mdiLock,
    mdiLockOutline,
    mdiNote,
    mdiNoteOutline,
    mdiSecurity,
    mdiTagMultiple,
    mdiTagMultipleOutline,
  } from '@mdi/js';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  const { children }: Props = $props();

  const { tags } = getOpenApi();
</script>

<AppShell>
  <AppShellHeader>
    <Header items={[]} />
  </AppShellHeader>

  <AppShellSidebar>
    <div class="mt-8 pe-6 flex flex-col gap-4">
      <div>
        <NavbarItem title="Introduction" href="/introduction" icon={mdiNoteOutline} activeIcon={mdiNote} />
        <NavbarItem title="Getting Started" href="/getting-started" icon={mdiCompassOutline} activeIcon={mdiCompass} />
        <NavbarItem title="Authorization" href="/authorization" icon={mdiSecurity} />
        <NavbarItem title="Permissions" href="/permissions" icon={mdiLockOutline} activeIcon={mdiLock} />
        <NavbarItem
          title="Playground"
          href="/playground"
          icon={mdiLightningBoltOutline}
          activeIcon={mdiLightningBolt}
        />
        <NavbarItem title="SDK" href="/sdk" icon={mdiCubeOutline} activeIcon={mdiCube} />
        <NavbarItem
          title="Endpoints"
          href="/api/endpoints"
          icon={mdiApi}
          active={page.url.pathname === '/api/endpoints'}
        />
        <NavbarItem
          title="Models"
          href="/api/models"
          icon={mdiTagMultipleOutline}
          activeIcon={mdiTagMultiple}
          active={page.url.pathname === '/api/models'}
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
