<script lang="ts">
  import Header from '$common/components/Header.svelte';
  import PageContent from '$common/components/PageContent.svelte';
  import { AppShell, AppShellHeader } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<AppShell>
  <AppShellHeader>
    <Header items={[]} />
  </AppShellHeader>

  <PageContent>
    {@render children?.()}
  </PageContent>
</AppShell>
