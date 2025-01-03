<script lang="ts">
  import FullPageLayout from '$lib/components/FullPageLayout.svelte';
  import {
    Button,
    Card,
    CardBody,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Code,
    Heading,
    Icon,
    Logo,
    Stack,
    SupporterBadge,
    Text,
    appStoreBadge,
    fdroidBadge,
    playStoreBadge,
  } from '@immich/ui';
  import { mdiAndroid, mdiDocker } from '@mdi/js';
</script>

<FullPageLayout>
  <Stack gap={8}>
    <SupporterBadge effect="always">
      <Logo size="large" variant="icon" />
      <Heading size="large" color="primary">Get Immich</Heading>
    </SupporterBadge>

    <Stack gap={2}>
      <div>
        <Heading size="large">Mobile Apps</Heading>
        <Text color="muted"
          >Download Immich app and start backing up your photos and videos securely to your own server</Text
        >
      </div>

      <div class="grid grid-cols-3 gap-2">
        <Stack>
          <Heading size="tiny">App Store</Heading>
          <a href="https://get.immich.app/ios">
            <img class="h-14 my-1" alt="Download on the App Store" src={appStoreBadge} />
          </a>
        </Stack>
        <Stack>
          <Heading size="tiny">PlayStore</Heading>
          <a href="https://play.google.com/store/apps/details?id=app.alextran.immich">
            <img class="-m-2" alt="Get it on Google Play" src={playStoreBadge} />
          </a>
        </Stack>
        <Stack>
          <Heading size="tiny">F-Droid</Heading>
          <a href="https://get.immich.app/fdroid">
            <img class="mx-2 h-16" alt="Get it on F-Droid" src={fdroidBadge} />
          </a>
        </Stack>
        <Stack>
          <Heading size="tiny">Android APK</Heading>
          <Button
            fullWidth
            href="https://github.com/immich-app/immich/releases/latest"
            variant="outline"
            color="secondary"
            class="w-48"
          >
            <Icon icon={mdiAndroid} size="2em" />
            <Text>Download APK</Text>
          </Button>
        </Stack>
      </div>
    </Stack>

    <Stack gap={2}>
      <div>
        <Heading size="large">Server</Heading>
        <Text color="muted">Download, setup, and run Immich on your own server</Text>
      </div>

      <section class="grid auto-rows-fr grid-cols-1 lg:grid-cols-2 gap-4">
        <Card color="secondary" variant="subtle" class="h-full">
          <CardHeader>
            <CardTitle>Docker Compose</CardTitle>
            <CardDescription
              >Generate and download a <Code>docker-compose.yaml</Code> file, specifically tailored to you setup.</CardDescription
            >
          </CardHeader>
          <CardBody class="flex align-middle items-center justify-center ">
            <Icon icon={mdiDocker} size="6rem" color="#0db7ed" />
          </CardBody>
          <CardFooter>
            <Button fullWidth href="/docker-compose">Generate</Button>
          </CardFooter>
        </Card>
      </section>
    </Stack>
  </Stack>
</FullPageLayout>
