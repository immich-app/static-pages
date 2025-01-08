<script lang="ts">
  import qrCode from '$lib/assets/img/app-qr-code-dark.svg';
  import screenshot from '$lib/assets/img/screenshot-dark.webp';
  import DocsHeader from '$lib/components/DocsHeader.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import {
    AppShell,
    AppShellHeader,
    appStoreBadge,
    Button,
    Heading,
    HStack,
    Icon,
    Logo,
    playStoreBadge,
    Text,
    VStack,
  } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
</script>

<AppShell>
  <AppShellHeader>
    <DocsHeader />
  </AppShellHeader>

  <PageContent>
    <VStack gap={8} class="p-8 text-center">
      <Logo size="giant" variant="logo" class="border" />
      <Heading size="title"
        >Self-hosted <span class="text-primary">photo and<br /> video management</span> solution</Heading
      >
      <Text
        >Easily back up, organize, and manage your photos on your own server. Immich helps you<br /> browse, search and organize
        your photos and videos with ease, without sacrificing your privacy.</Text
      >
      <HStack>
        <Button size="large" href="/docs">Install</Button>
        <Button size="large" href="/docs" color="secondary">
          <span>Open Demo</span>
          <Icon icon={mdiOpenInNew} />
        </Button>
      </HStack>
      <Button size="large" variant="ghost">Join our Discord</Button>

      <img src={screenshot} alt="Immich application" />

      <hr class="border-t w-full max-w-screen-sm m-8" />
      <Heading size="title">Download mobile app</Heading>
      <Text>Download Immich app and start backing up your photos and videos securely to your own server</Text>
      <HStack gap={0}>
        <Button href="" variant="ghost" class="p-0">
          <img src={playStoreBadge} alt="Playstore Badge" class="h-24" />
        </Button>
        <Button href="" variant="ghost" class="p-0">
          <img src={appStoreBadge} alt="Playstore Badge" class="h-24 p-4" />
        </Button>
      </HStack>
      <img src={qrCode} alt="QRCode" class="h-36" />
    </VStack>
  </PageContent>
</AppShell>
