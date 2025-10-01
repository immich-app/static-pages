<script lang="ts">
  import { Constants } from '@immich/ui';
  import qrCode from '$lib/assets/img/app-qr-code-dark.svg';
  import screenshot from '$lib/assets/img/screenshot-dark.webp';
  import { appStoreBadge, Button, Heading, Icon, Link, Logo, playStoreBadge, Text, VStack } from '@immich/ui';
  import { mdiKeyOutline, mdiOpenInNew, mdiShoppingOutline } from '@mdi/js';
  import { siDiscord, siGithub, siWeblate } from 'simple-icons';

  const supportItems = [
    { href: Constants.Sites.Buy, text: 'Buy Immich', icon: mdiKeyOutline },
    { href: Constants.Sites.Store, text: 'Buy Merch', icon: mdiShoppingOutline },
    { href: Constants.Socials.Github, text: 'View on GitHub', icon: siGithub.path },
    { href: Constants.Socials.Weblate, text: 'Translate on Weblate', icon: siWeblate.path },
  ];
</script>

<VStack gap={8} class="mt-4 lg:mt-16 text-center">
  <Logo size="giant" variant="stacked-futo" />
  <Heading size="title" tag="h1" fontWeight="extra-bold"
    >Self-hosted <span class="text-primary">photo and<br class="hidden lg:block" /> video management</span> solution</Heading
  >
  <Text size="large"
    >Easily back up, organize, and manage your photos on your own server. Immich helps you<br class="hidden lg:block" />
    browse, search and organize your photos and videos with ease, without sacrificing your privacy.</Text
  >

  <div class="flex flex-col gap-4">
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <Button size="large" href="/download">Download</Button>
      <Button size="large" href={Constants.Sites.Demo} color="secondary">
        <span>Open Demo</span>
        <Icon icon={mdiOpenInNew} />
      </Button>
    </div>
    <div class="flex justify-center">
      <Button href={Constants.Socials.Discord} size="large" variant="ghost" leadingIcon={siDiscord.path}
        >Join our Discord</Button
      >
    </div>
  </div>

  <div class="relative -z-10">
    <img src={screenshot} alt="Immich application" />
    <div class="-top-[55%] left-0 h-[200%] w-full absolute -z-10 overflow-visible">
      <Logo size="giant" class="h-full w-full mb-2 antialiased z-10 blur-3xl opacity-20" />
      <div class="w-full h-full absolute left-0 top-0 backdrop-blur-xl bg-immich-bg/90 dark:bg-transparent"></div>
    </div>
  </div>

  <hr class="border-t w-full max-w-(--breakpoint-sm) m-2" />
  <Heading size="title" tag="h2">Download mobile app</Heading>
  <Text size="large">Download Immich app and start backing up your photos and videos securely to your own server</Text>
  <div class="flex flex-col lg:flex-row gap-4">
    <Button href={Constants.Get.Android} variant="ghost" class="p-0">
      <img src={playStoreBadge} alt="Playstore Badge" class="h-16" />
    </Button>
    <Button href={Constants.Get.iOS} variant="ghost" class="p-0">
      <img src={appStoreBadge} alt="AppStore Badge" class="h-16" />
    </Button>
  </div>
  <img src={qrCode} alt="QRCode" class="h-36 rounded-xl" />

  <hr class="border-t w-full max-w-(--breakpoint-sm) m-8" />
  <Heading size="title" tag="h2">Support the project</Heading>
  <Text size="large"
    >Support Immich by purchasing a <Link href={Constants.Sites.Buy}>product key</Link>, <Link
      href={Constants.Sites.Buy}>merch</Link
    >, or contributing on <Link href={Constants.Sites.Buy}>GitHub</Link> or
    <Link href={Constants.Sites.Buy}>Weblate</Link></Text
  >
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each supportItems as action, i (i)}
      <Button href={action.href} size="large" variant="outline" color="secondary" leadingIcon={action.icon}>
        {action.text}
      </Button>
    {/each}
  </div>
</VStack>
