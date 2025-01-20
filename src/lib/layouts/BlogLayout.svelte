<script lang="ts">
  import '$lib/app.css';
  import DocsHeader from '$lib/components/DocsHeader.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import { AppShell, AppShellHeader, AppShellSidebar, NavbarGroup, NavbarItem } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<AppShell>
  <AppShellHeader>
    <DocsHeader />
  </AppShellHeader>

  <AppShellSidebar noBorder>
    <div class="w-full md:w-[300px]">
      <div class="mt-4 mr-0 lg:mr-4">
        <NavbarGroup title="2024" />
        <div class="ml-0 md:ml-2">
          <NavbarItem
            title="Buy a product key asdflasdfasdfasdfasdfasdf"
            href="blog/2024/08-product-key-announcement"
          />
          <NavbarItem title="July Update" href="/blog/2024/07-update" />
          <NavbarItem title="Immich joins FUTO" href="/blog/2024/05-core-team-goes-full-time" />
        </div>
        <NavbarGroup title="2023" />
        <div class="ml-0 md:ml-2">
          <NavbarItem title="Year-end Recap" href="/blog/2023/12-recap" />
          <NavbarItem title="Immich Update - July 2023" href="/blog/2023/06-update" />
        </div>
      </div>
    </div>
  </AppShellSidebar>

  <PageContent>
    {@render children?.()}
  </PageContent>
</AppShell>
