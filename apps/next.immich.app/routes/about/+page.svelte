<script lang="ts">
  import PageContent from '$lib/components/PageContent.svelte';
  import DocsLayout from '$lib/layouts/DocsLayout.svelte';
  import { Heading, Stack, Text } from '@immich/ui';
</script>

<DocsLayout>
  <PageContent class="mx-auto w-full max-w-screen-lg">
    <Stack>
      <Heading size="title" tag="h1">About</Heading>
      <Text>Meet the team</Text>
    </Stack>
  </PageContent>
</DocsLayout>
