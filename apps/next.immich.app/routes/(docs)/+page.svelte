<script lang="ts">
  import qrCode from '$lib/assets/img/app-qr-code-dark.svg';
  import screenshot from '$lib/assets/img/screenshot-dark.webp';
  import { appStoreBadge, Button, Heading, Icon, Logo, playStoreBadge, Text, VStack } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
</script>

<VStack gap={8} class="mt-4 lg:mt-16 text-center">
  <Logo size="giant" variant="logo" class="border" />
  <Heading size="title" tag="h1"
    >Self-hosted <span class="text-primary">photo and<br class="hidden lg:block" /> video management</span> solution</Heading
  >
  <Text
    >Easily back up, organize, and manage your photos on your own server. Immich helps you<br class="hidden lg:block" />
    browse, search and organize your photos and videos with ease, without sacrificing your privacy.</Text
  >

  <div class="flex flex-col gap-4">
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <Button size="large" href="/download">Download</Button>
      <Button size="large" href="https://demo.immich.app/" color="secondary">
        <span>Open Demo</span>
        <Icon icon={mdiOpenInNew} />
      </Button>
    </div>
    <div class="flex justify-center">
      <Button size="large" variant="ghost">Join our Discord</Button>
    </div>
  </div>

  <img src={screenshot} alt="Immich application" />

  <hr class="border-t w-full max-w-(--breakpoint-sm) m-8" />
  <Heading size="title" tag="h2">Download mobile app</Heading>
  <Text>Download Immich app and start backing up your photos and videos securely to your own server</Text>
  <div class="flex flex-col lg:flex-row">
    <Button href="" variant="ghost" class="p-0">
      <img src={playStoreBadge} alt="Playstore Badge" class="h-24" />
    </Button>
    <Button href="" variant="ghost" class="p-0">
      <img src={appStoreBadge} alt="Playstore Badge" class="h-24 p-[16px]" />
    </Button>
  </div>
  <img src={qrCode} alt="QRCode" class="h-36" />
</VStack>
