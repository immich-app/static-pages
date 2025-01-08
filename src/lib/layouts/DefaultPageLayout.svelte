<script lang="ts">
  import '$lib/app.css';
  import Header from '$lib/components/Header.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import { AppShell, AppShellHeader } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

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
