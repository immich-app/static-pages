<script lang="ts">
  import { Constants } from '$lib';
  import FooterLink from '$lib/components/FooterLink.svelte';
  import { Heading, Stack, Text, ThemeSwitcher, VStack } from '@immich/ui';
  import {
    mdiBookshelf,
    mdiChartGantt,
    mdiCubeOutline,
    mdiHomeSearchOutline,
    mdiKey,
    mdiOfficeBuildingOutline,
    mdiScriptTextOutline,
    mdiServerOutline,
    mdiShoppingOutline,
  } from '@mdi/js';
  import { siAndroid, siApple, siDiscord, siGithub, siReddit } from 'simple-icons';
</script>

<div class="bg-dark/10 rounded-t-3xl mt-16 p-8">
  <div class="max-w-(--breakpoint-lg) mx-auto xl:py-8">
    <Stack gap={8}>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 place-center">
        <Stack>
          <Heading size="tiny">Social</Heading>
          <FooterLink href={Constants.Socials.Github} icon={siGithub} text="GitHub" />
          <FooterLink href={Constants.Socials.Discord} icon={siDiscord} text="Discord" />
          <FooterLink href={Constants.Socials.Reddit} icon={siReddit} text="Reddit" />
        </Stack>

        <Stack>
          <Heading size="tiny">Download</Heading>
          <FooterLink href={Constants.Get.Android} icon={siAndroid} text="Android" />
          <FooterLink href={Constants.Get.iOS} icon={siApple} text="iOS" />
          <FooterLink href={Constants.Get.DockerCompose} icon={mdiServerOutline} text="Server" />
        </Stack>

        <Stack>
          <Heading size="tiny">Company</Heading>
          <FooterLink href={Constants.Socials.Futo} icon={mdiOfficeBuildingOutline} text="FUTO" />
          <FooterLink href={Constants.Sites.Buy} icon={mdiKey} text="Purchase" />
          <FooterLink href={Constants.Sites.Store} icon={mdiShoppingOutline} text="Merch" />
        </Stack>

        <Stack>
          <Heading size="tiny">Sites</Heading>
          <FooterLink href={Constants.Sites.Docs} icon={mdiScriptTextOutline} text="Documentation" />
          <FooterLink href={Constants.Sites.My} icon={mdiHomeSearchOutline} text="My Immich" />
          <FooterLink href={Constants.Sites.Api} icon={mdiCubeOutline} text="Immich API" />
        </Stack>

        <Stack>
          <Heading size="tiny">Miscellaneous</Heading>
          <FooterLink href={Constants.Pages.Roadmap} icon={mdiChartGantt} text="Roadmap" />
          <FooterLink href={Constants.Pages.CursedKnowledge} icon={mdiBookshelf} text="Cursed Knowledge" />
        </Stack>
      </div>
      <VStack class="text-center">
        <Text size="large">This project is available under GNU AGPL v3 license.</Text>
        <Text color="muted" variant="italic">Privacy should not be a luxury</Text>
        <ThemeSwitcher color="secondary" />
      </VStack>
    </Stack>
  </div>
</div>
