<script lang="ts">
  import qrCodeDark from '$common/img/app-qr-code-dark.svg';
  import qrCodeLight from '$common/img/app-qr-code-light.svg';
  import kubernetesIcon from '$common/img/kubernetes.webp';
  import portainerIcon from '$common/img/portainer.svg';
  import truenasIcon from '$common/img/truenas-scale.svg';
  import unraidIcon from '$common/img/unraid.svg';
  import { siteMetadata } from '$lib';
  import featureMobile from '$lib/assets/img/feature-mobile.webp';
  import FeatureHighlight from '$lib/components/FeatureHighlight.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
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
  } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
  import { siDocker } from 'simple-icons';

  const pageMetadata = {
    title: 'Download Immich',
    description: 'Install Immich on a server and download mobile apps to start backing up your photos and videos.',
  };
</script>

<SiteMetadata site={siteMetadata} page={pageMetadata} />

<PageContent>
  <Container size="large" center class="my-16 flex flex-col items-center text-center">
    <Logo size="giant" variant="logo" class="mb-4 border" />
    <Heading size="title" class="mb-4" tag="h1">{pageMetadata.title}</Heading>
    <Text size="giant" class="mb-4 max-w-xl">{pageMetadata.description}</Text>
  </Container>
</PageContent>

<FeatureHighlight>
  {#snippet label()}
    <Heading size="large" tag="h3" class="mb-2">Download for Mobile</Heading>
    <Text size="large">Use Immich to backup your photos and videos from your Android and iOS devices.</Text>

    <div class="my-8 h-full lg:my-4">
      <div class="flex flex-wrap gap-4 sm:justify-start">
        <Button href={Constants.Get.FDroid} color="primary" trailingIcon={mdiOpenInNew}>FUTO F-Droid</Button>
        <Button href={Constants.Get.GithubRelease} color="primary" trailingIcon={mdiOpenInNew}>Download APK</Button>
      </div>
      <div class="my-8 flex h-full gap-4 sm:justify-start lg:my-4">
        <div class="flex flex-col items-start gap-4">
          <a href={Constants.Get.Android}>
            <img src={playStoreBadge} alt="Playstore Badge" class="w-48" />
          </a>
          <a href={Constants.Get.iOS}>
            <img src={appStoreBadge} alt="AppStore Badge" class="w-48" />
          </a>
        </div>
        <img src={themeManager.value === 'dark' ? qrCodeDark : qrCodeLight} alt="QRCode" class="h-36 rounded-xl" />
      </div>
    </div>
  {/snippet}
  {#snippet media()}
    <img src={featureMobile} alt="Mobile app" class="object-scale-down" />
  {/snippet}
</FeatureHighlight>

<FeatureHighlight reverse>
  {#snippet label()}
    <Heading size="large" tag="h3" class="mb-2">Install with Docker</Heading>
    <Text size="large">Run Immich on your own server using Docker Compose.</Text>

    <div class="my-8 flex h-full justify-around gap-4 sm:justify-start lg:my-4">
      <div class="flex flex-wrap gap-4">
        <Button href="https://immich.app/docs/install/docker-compose" trailingIcon={mdiOpenInNew}>View docs</Button>
        <Button color="secondary" href="/docker-compose-builder">Build a compose file</Button>
      </div>
    </div>
  {/snippet}
  {#snippet media()}
    <Icon icon={siDocker} class="h-full w-32 max-w-48 text-[#2560ff] md:w-48" />
  {/snippet}
</FeatureHighlight>

<FeatureHighlight>
  {#snippet label()}
    <Heading size="large" tag="h3" class="mb-2">Install with Kubernetes</Heading>
    <Text size="large">Run Immich on your Kubernetes cluster using the official helm chart.</Text>

    <div class="my-8 flex h-full justify-around gap-4 sm:justify-start lg:my-4">
      <div class="flex flex-wrap gap-4">
        <Button href="https://immich.app/docs/install/kubernetes" trailingIcon={mdiOpenInNew}>View docs</Button>
      </div>
    </div>
  {/snippet}
  {#snippet media()}
    <img src={kubernetesIcon} class="w-32 md:w-48" alt="Kubernetes logo" />
  {/snippet}
</FeatureHighlight>

<FeatureHighlight reverse>
  {#snippet label()}
    <Heading size="large" tag="h3" class="mb-2">Install with 3rd Party</Heading>
    <Text size="large">Run Immich on your NAS using one of our community guides.</Text>

    <div class="my-8 flex h-full justify-around gap-4 sm:justify-start lg:my-4">
      <div class="flex flex-wrap gap-2">
        <Button href="https://docs.immich.app/install/portainer" trailingIcon={mdiOpenInNew}>Portainer Guide</Button>
        <Button href="https://docs.immich.app/install/unraid" trailingIcon={mdiOpenInNew}>unRaid Guide</Button>
        <Button href="https://docs.immich.app/install/truenas" trailingIcon={mdiOpenInNew}>TrueNAS SCALE Guide</Button>
      </div>
    </div>
  {/snippet}
  {#snippet media()}
    <div class="grid grid-cols-3 gap-8">
      <img src={portainerIcon} class="w-28 md:w-42" alt="Portainer logo" />
      <img src={unraidIcon} class="w-32 md:w-48" alt="UnRaid logo" />
      <img src={truenasIcon} class="w-32 md:w-48" alt="TrueNAS SCALE logo" />
    </div>
  {/snippet}
</FeatureHighlight>
