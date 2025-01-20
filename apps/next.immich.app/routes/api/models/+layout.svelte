<script lang="ts">
  import DocsHeader from '$lib/components/DocsHeader.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import { getOpenApi } from '$lib/services/open-api.svelte';
  import { AppShell, AppShellHeader, AppShellSidebar, Button, Icon, NavbarGroup, NavbarItem } from '@immich/ui';
  import { mdiArrowLeft } from '@mdi/js';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  const { children }: Props = $props();

  const { models } = getOpenApi();
</script>

<AppShell>
  <AppShellHeader>
    <DocsHeader />
  </AppShellHeader>

  <AppShellSidebar class="min-w-[300px]" noBorder>
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
    <NavbarGroup title="Models" />
    {#each models as model}
      <NavbarItem title={model.name} href={model.href} variant="compact" />
    {/each}
  </AppShellSidebar>

  <PageContent>
    {@render children?.()}
  </PageContent>
</AppShell>
