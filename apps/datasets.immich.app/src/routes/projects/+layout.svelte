<script lang="ts">
  import Header from '$common/components/Header.svelte';
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
  <div class="mx-auto flex h-full flex-col">
    <div class="grow">
      <div class="w-full px-3">
        {@render children?.()}
      </div>
    </div>
  </div>
</AppShell>
