<script lang="ts">
  import DocsHeader from '$lib/components/DocsHeader.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import { getOpenApi } from '$lib/services/open-api.svelte';
  import { getIcon } from '$lib/utils/icons';
  import { AppShell, AppShellHeader, AppShellSidebar, Button, Icon, NavbarGroup, NavbarItem } from '@immich/ui';
  import { mdiArrowLeft } from '@mdi/js';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  const { children }: Props = $props();

  const { tags } = getOpenApi();
</script>

<AppShell>
  <AppShellHeader>
    <DocsHeader />
  </AppShellHeader>

  <AppShellSidebar class="min-w-[300px]">
    <Button
      variant="ghost"
      color="secondary"
      href="/api"
      shape="rectangle"
      class="flex justify-start py-4"
      size="small"
    >
      <Icon icon={mdiArrowLeft} />
      Back
    </Button>
    <NavbarGroup title="Endpoints" />
    {#each tags as tag}
      <NavbarItem title={tag.name} href={tag.href} icon={getIcon(tag.name)} variant="compact" />
    {/each}
  </AppShellSidebar>

  <PageContent>
    {@render children?.()}
  </PageContent>
</AppShell>
