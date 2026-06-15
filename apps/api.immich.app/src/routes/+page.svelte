<script lang="ts">
  import PageContent from '$common/components/PageContent.svelte';
  import stackedBlocksUrl from '$lib/assets/img/stacked-blocks.svg';
  import {
    AppShell,
    AppShellHeader,
    Button,
    CommandPaletteButton,
    Constants,
    ControlBar,
    ControlBarHeader,
    ControlBarOverflow,
    Heading,
    Link,
    Logo,
    Text,
    ThemeSwitcher,
    VStack,
  } from '@immich/ui';
  import { mdiCubeOutline, mdiOpenInNew } from '@mdi/js';
</script>

<AppShell>
  <AppShellHeader class="w-full">
    <ControlBar static variant="ghost">
      <ControlBarHeader class="flex-row items-center">
        <a href="/">
          <Logo variant="inline" />
        </a>
      </ControlBarHeader>
      <ControlBarOverflow>
        <Button href="/getting-started" shape="round" color="secondary" size="small" class="hidden sm:block">
          Get started
        </Button>
        <CommandPaletteButton />
        <ThemeSwitcher size="medium" />
      </ControlBarOverflow>
    </ControlBar>
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
        <Heading tag="h3">Not a developer?</Heading>
        <Text color="muted">Learn more about Immich at <Link href={Constants.Sites.Docs} /></Text>
      </div>
      <Button href={Constants.Sites.Docs} target="_blank" color="secondary" shape="round" leadingIcon={mdiOpenInNew}
        >Open Docs</Button
      >
    </VStack>
  </PageContent>
</AppShell>
