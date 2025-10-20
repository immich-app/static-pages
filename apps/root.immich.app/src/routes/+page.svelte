<script lang="ts">
  import qrCodeDark from '$common/img/app-qr-code-dark.svg';
  import qrCodeLight from '$common/img/app-qr-code-light.svg';
  import screenshotDark from '$common/img/screenshot-dark.webp';
  import screenshotLight from '$common/img/screenshot-light.webp';
  import { siteMetadata } from '$lib';
  import {
    appStoreBadge,
    Button,
    Constants,
    Heading,
    Icon,
    Link,
    Logo,
    playStoreBadge,
    SiteMetadata,
    Text,
    theme,
    VStack,
  } from '@immich/ui';
  import { mdiKeyOutline, mdiOpenInNew, mdiShoppingOutline } from '@mdi/js';
  import { siDiscord, siGithub, siWeblate } from 'simple-icons';

  const supportItems = [
    { href: Constants.Sites.Buy, text: 'Buy Immich', icon: mdiKeyOutline },
    { href: Constants.Sites.Store, text: 'Buy Merch', icon: mdiShoppingOutline },
    { href: Constants.Socials.Github, text: 'View on GitHub', icon: siGithub.path },
    { href: Constants.Socials.Weblate, text: 'Translate on Weblate', icon: siWeblate.path },
  ];
</script>

<SiteMetadata site={siteMetadata} />

<VStack gap={8} class="mt-4 text-center lg:mt-16">
  <Logo size="giant" variant="stacked-futo" />

  <Heading size="title" tag="h1" fontWeight="extra-bold">
    Self-hosted <span class="text-primary">photo and<br class="hidden lg:block" /> video management</span> solution
  </Heading>

  <Text size="large">
    Easily back up, organize, and manage your photos on your own server. Immich helps you<br class="hidden lg:block" />
    browse, search and organize your photos and videos with ease, without sacrificing your privacy.
  </Text>

  <div class="flex flex-col gap-4">
    <div class="flex flex-col justify-center gap-4 sm:flex-row">
      <Button size="large" href="/download">Download</Button>
      <Button size="large" href={Constants.Sites.Demo} color="secondary">
        <span>Open Demo</span>
        <Icon icon={mdiOpenInNew} />
      </Button>
    </div>
    <div class="flex justify-center">
      <Button href={Constants.Socials.Discord} size="large" variant="ghost" leadingIcon={siDiscord.path}>
        Join our Discord
      </Button>
    </div>
  </div>

  <div class="relative -z-10">
    <img src={theme.value === 'dark' ? screenshotDark : screenshotLight} alt="Immich application" />

    <div class="absolute -top-[55%] left-0 -z-10 h-[200%] w-full overflow-visible">
      <Logo size="giant" class="z-10 mb-2 h-full w-full antialiased opacity-20 blur-3xl" />
      <div class="bg-immich-bg/90 absolute left-0 top-0 h-full w-full backdrop-blur-xl dark:bg-transparent"></div>
    </div>
  </div>

  <hr class="max-w-(--breakpoint-sm) m-2 w-full border-t" />
  <Heading size="title" tag="h2">Download mobile app</Heading>

  <Text size="large">Download Immich app and start backing up your photos and videos securely to your own server</Text>

  <div class="flex flex-col gap-4 lg:flex-row">
    <Button href={Constants.Get.Android} variant="ghost" class="p-0">
      <img src={playStoreBadge} alt="Playstore Badge" class="h-16" />
    </Button>
    <Button href={Constants.Get.iOS} variant="ghost" class="p-0">
      <img src={appStoreBadge} alt="AppStore Badge" class="h-16" />
    </Button>
  </div>

  <img src={theme.value === 'dark' ? qrCodeDark : qrCodeLight} alt="QRCode" class="h-36 rounded-xl" />

  <hr class="max-w-(--breakpoint-sm) m-8 w-full border-t" />
  <Heading size="title" tag="h2">Support the project</Heading>

  <Text size="large">
    Support Immich by purchasing a <Link href={Constants.Sites.Buy}>product key</Link>,
    <Link href={Constants.Sites.Store}>merch</Link>, or contributing on
    <Link href={Constants.Socials.Github}>GitHub</Link> or
    <Link href={Constants.Socials.Weblate}>Weblate</Link>
  </Text>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    {#each supportItems as action, i (i)}
      <Button href={action.href} size="large" variant="outline" color="secondary" leadingIcon={action.icon}>
        {action.text}
      </Button>
    {/each}
  </div>
</VStack>
