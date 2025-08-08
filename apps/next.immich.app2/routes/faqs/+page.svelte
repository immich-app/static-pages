<script lang="ts">
  import DocsHeader from '$lib/components/DocsHeader.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import { AppShell, AppShellHeader, Heading, Stack } from '@immich/ui';
</script>

<AppShell>
  <AppShellHeader>
    <DocsHeader />
  </AppShellHeader>

  <PageContent class="mx-auto w-full max-w-(--breakpoint-lg)">
    <Stack>
      <Heading size="title" tag="h1">Frequently Asked Questions</Heading>
    </Stack>
  </PageContent>
</AppShell>
