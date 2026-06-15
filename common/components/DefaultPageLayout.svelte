<script lang="ts">
  import Header from '$common/components/Header.svelte';
  import PageContent from '$common/components/PageContent.svelte';
  import { AppShell, AppShellHeader } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();
</script>

<AppShell>
  <AppShellHeader>
    <Header />
  </AppShellHeader>

  <PageContent class="mx-auto w-full max-w-(--breakpoint-lg)">
    {@render children?.()}
  </PageContent>
</AppShell>
