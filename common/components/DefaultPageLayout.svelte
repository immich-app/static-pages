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

  <PageContent class="max-w-(--breakpoint-lg) w-full mx-auto">
    {@render children?.()}
  </PageContent>
</AppShell>
