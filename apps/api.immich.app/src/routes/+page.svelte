<script lang="ts">
  import Header from '$common/components/Header.svelte';
  import PageContent from '$common/components/PageContent.svelte';
  import stackedBlocksUrl from '$lib/assets/img/stacked-blocks.svg';
  import { AppShell, AppShellHeader, Button, Constants, Heading, Link, Logo, Text, VStack } from '@immich/ui';
  import { mdiCubeOutline, mdiOpenInNew } from '@mdi/js';
</script>

<AppShell>
  <AppShellHeader class="w-full">
    <Header
      items={[
        {
          title: 'Get Started',
          href: '/introduction',
          variant: 'filled',
          color: 'secondary',
          show: 'always',
        },
      ]}
    />
  </AppShellHeader>

  <PageContent class="mx-auto w-full max-w-(--breakpoint-lg)">
    <VStack gap={8} class="mt-4 text-center lg:mt-16">
      <Logo size="giant" variant="logo" class="border" />
      <div class="flex flex-col gap-2">
        <Heading size="title" tag="h1">Immich API</Heading>
        <Text color="muted">Documentation for the REST API that powers Immich</Text>
      </div>
      <Button size="large" href="/introduction" color="secondary" shape="round" leadingIcon={mdiCubeOutline}
        >Start Building</Button
      >

      <img src={stackedBlocksUrl} alt="Stacked blocks" />

      <div class="flex flex-col gap-2">
        <Heading size="giant" tag="h2">Not a developer?</Heading>
        <Text color="muted"
          >Learn more about Immich at <Link href={Constants.Sites.Docs}>{Constants.Sites.Docs}</Link></Text
        >
      </div>
      <Button
        size="large"
        href={Constants.Sites.Docs}
        target="_blank"
        color="secondary"
        shape="round"
        leadingIcon={mdiOpenInNew}>Open Docs</Button
      >
    </VStack>
  </PageContent>
</AppShell>
