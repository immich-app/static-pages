<script lang="ts">
  import { browser } from '$app/environment';
  import qrCodeDark from '$common/img/app-qr-code-dark.svg';
  import qrCodeLight from '$common/img/app-qr-code-light.svg';
  import screenshotDark from '$common/img/screenshot-dark.webp';
  import screenshotLight from '$common/img/screenshot-light.webp';
  import { siteMetadata } from '$lib';
  import featureFacialRecognition from '$lib/assets/img/feature-facial-recognition.webp';
  import featureMobile from '$lib/assets/img/feature-mobile.webp';
  import featureSharing from '$lib/assets/img/feature-sharing.webp';
  import FeatureContainer from '$lib/components/FeatureContainer.svelte';
  import FeatureHighlight from '$lib/components/FeatureHighlight.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import SupportCard from '$lib/components/SupportCard.svelte';
  import SupportLinkCard from '$lib/components/SupportLinkCard.svelte';
  import {
    appStoreBadge,
    Button,
    Constants,
    Container,
    Heading,
    Icon,
    Logo,
    playStoreBadge,
    SiteMetadata,
    Text,
    themeManager,
    VStack,
  } from '@immich/ui';
  import { mdiKeyVariant, mdiOpenInNew, mdiSourcePull, mdiTshirtCrew } from '@mdi/js';
  import { siDiscord, siGithub } from 'simple-icons';
</script>

<!-- only SSR SiteMetadata  -->
<SiteMetadata site={siteMetadata} />

{#if browser}
  <PageContent>
    <Container size="large" center>
      <VStack gap={8} class="mt-4 text-center lg:mt-16">
        <Logo size="giant" variant="stacked-futo" />

        <Heading size="title" tag="h1" fontWeight="extra-bold">
          Self-hosted <span class="text-primary">photo and<br class="hidden lg:block" /> video management</span> solution
        </Heading>

        <Text size="large">
          Easily back up, organize, and manage your photos on your own server. Immich helps you<br
            class="hidden lg:block"
          />
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
          <img src={themeManager.value === 'dark' ? screenshotDark : screenshotLight} alt="Immich application" />

          <div class="absolute top-[-55%] left-0 -z-10 h-[200%] w-full overflow-visible">
            <Logo size="giant" class="z-10 mb-2 size-full antialiased opacity-20 blur-3xl" />
            <div class="bg-immich-bg/90 absolute top-0 left-0 size-full backdrop-blur-xl dark:bg-transparent"></div>
          </div>
        </div>
      </VStack>
    </Container>
  </PageContent>

  <FeatureHighlight>
    {#snippet label()}
      <Heading size="large" tag="h3" class="mb-2">Mobile app</Heading>
      <Text size="large">
        View and manage your photos and videos directly from the mobile app. Immich makes it easy to organize, explore
        and share your precious memories on both Apple and Android.
      </Text>

      <div class="my-8 flex h-full justify-around gap-4 sm:justify-start lg:my-4">
        <div class="flex flex-col items-start justify-around gap-4">
          <a href={Constants.Get.Android}>
            <img src={playStoreBadge} alt="Playstore Badge" class="w-48" />
          </a>
          <a href={Constants.Get.iOS}>
            <img src={appStoreBadge} alt="AppStore Badge" class="w-48" />
          </a>
        </div>
        <img src={themeManager.value === 'dark' ? qrCodeDark : qrCodeLight} alt="QRCode" class="h-36 rounded-xl" />
      </div>
    {/snippet}
    {#snippet media()}
      <img src={featureMobile} alt="Mobile app" class="object-scale-down" />
    {/snippet}
  </FeatureHighlight>

  <FeatureHighlight reverse>
    {#snippet label()}
      <Heading size="large" tag="h3" class="mb-2">Sharing</Heading>
      <Text size="large">
        Share with friends and family using shared albums, partner sharing, and shared links. Everyone has their own
        account and can collaborate together.
      </Text>
    {/snippet}
    {#snippet media()}
      <img src={featureSharing} alt="Sharing" class="object-scale-down" />
    {/snippet}
  </FeatureHighlight>

  <FeatureHighlight>
    {#snippet label()}
      <Heading size="large" tag="h3" class="mb-2">Facial Recognition</Heading>
      <Text size="large">
        Immich automatically detects and groups similar faces together, providing another way to search, organize, or
        browse your photos and videos.
      </Text>
    {/snippet}
    {#snippet media()}
      <img
        src={featureFacialRecognition}
        alt="Face box around a detected person"
        class="rounded-xl object-scale-down"
      />
    {/snippet}
  </FeatureHighlight>

  <FeatureContainer size="large" class="flex items-center">
    <div>
      <Heading size="large" tag="h2" class="mb-8 text-center">Support Immich</Heading>
      <div class="flex w-full flex-col gap-5">
        <SupportCard title="Product Key" icon={mdiKeyVariant} href={Constants.Sites.Buy} text="Buy a key">
          Building Immich takes a lot of time and effort. We have full-time engineers working on it to make it as good
          as we possibly can. Consider buying a product key to support the project.
        </SupportCard>

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SupportLinkCard
            title="Merch Store"
            icon={mdiTshirtCrew}
            color="warning"
            href={Constants.Sites.Store}
            text="View store"
          />
          <SupportLinkCard
            title="Contribute"
            icon={mdiSourcePull}
            color="info"
            buttonIcon={siGithub}
            href={Constants.Socials.Github}
            text="GitHub"
          />
        </div>
      </div>
    </div>
  </FeatureContainer>
{:else}
  <div class="h-screen w-full"></div>
{/if}
