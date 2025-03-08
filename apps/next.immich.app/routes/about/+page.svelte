<script lang="ts">
  import DocsHeader from '$lib/components/DocsHeader.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import { AppShell, AppShellHeader, Heading, Stack, Text } from '@immich/ui';
</script>

<AppShell>
  <AppShellHeader>
    <DocsHeader />
  </AppShellHeader>

  <PageContent class="mx-auto w-full max-w-screen-lg">
    <Stack>
      <Heading size="title" tag="h1">About</Heading>
      <Text>Meet the team</Text>
    </Stack>
  </PageContent>
</AppShell>
