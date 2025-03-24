<script lang="ts">
  import PageContent from '$lib/components/PageContent.svelte';
  import DocsLayout from '$lib/layouts/DocsLayout.svelte';
  import { getOpenApi } from '$lib/services/open-api.svelte';
  import { getIcon } from '$lib/utils/icons';
  import { Button, Icon, NavbarGroup, NavbarItem } from '@immich/ui';
  import { mdiArrowLeft } from '@mdi/js';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  const { children }: Props = $props();

  const { tags } = getOpenApi();
</script>

<DocsLayout>
  {#snippet sidebar()}
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
  {/snippet}

  <PageContent>
    {@render children?.()}
  </PageContent>
</DocsLayout>
