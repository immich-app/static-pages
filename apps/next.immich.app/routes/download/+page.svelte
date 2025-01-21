<script lang="ts">
  import portainerIcon from '$lib/assets/img/portainer.svg';
  import truenasIcon from '$lib/assets/img/truenas-scale.svg';
  import unraidIcon from '$lib/assets/img/unraid.svg';
  import DocsHeader from '$lib/components/DocsHeader.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import {
    AppShell,
    AppShellHeader,
    appStoreBadge,
    Button,
    Card,
    CardBody,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    fdroidBadge,
    Heading,
    Icon,
    Link,
    playStoreBadge,
    Stack,
    Text,
  } from '@immich/ui';
  import { mdiAndroid, mdiDocker } from '@mdi/js';
</script>

<AppShell>
  <AppShellHeader>
    <DocsHeader />
  </AppShellHeader>

  <PageContent class="mx-auto max-w-screen-lg">
    <Stack gap={8}>
      <Heading size="title">Download</Heading>
      <Stack gap={2}>
        <div>
          <Heading size="large">Mobile Apps</Heading>
          <Text color="muted"
            >Download Immich app and start backing up your photos and videos securely to your own server</Text
          >
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 l gap-4">
          <Card color="secondary">
            <CardHeader>
              <CardTitle>Android</CardTitle>
            </CardHeader>
            <CardBody>
              <Stack gap={4}>
                <a href="https://get.immich.app/android">
                  <img class="h-24 mx-auto" alt="Get it on Google Play" src={playStoreBadge} />
                </a>
                <a href="https://get.immich.app/fdroid">
                  <img class="h-16 mx-auto rounded-xl border border-dark" alt="Get it on F-Droid" src={fdroidBadge} />
                </a>
                <Button
                  class="h-16 mx-auto mt-4 dark:bg-black dark:text-white"
                  size="giant"
                  href="https://github.com/immich-app/immich/releases/latest"
                  color="secondary"
                >
                  <Icon icon={mdiAndroid} size="2em" />
                  <Text>Download APK</Text>
                </Button>
              </Stack>
            </CardBody>
          </Card>

          <Card color="secondary">
            <CardHeader>
              <CardTitle>iOS</CardTitle>
            </CardHeader>
            <CardBody>
              <a href="https://get.immich.app/ios">
                <img class="h-16 mt-4 mx-auto" alt="Download on the App Store" src={appStoreBadge} />
              </a>
            </CardBody>
          </Card>
        </div>
      </Stack>

      <Stack gap={2}>
        <div>
          <Heading size="large">Server</Heading>
          <Text color="muted">Download, setup, and run Immich on your own server</Text>
        </div>

        <section class="grid auto-rows-fr grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card color="secondary" class="h-full">
            <CardHeader>
              <CardTitle>Docker Compose</CardTitle>
              <CardDescription>Run Immich on <Link href="https://www.docker.com/">Docker</Link></CardDescription>
            </CardHeader>
            <CardBody class="flex align-middle items-center justify-center ">
              <Icon icon={mdiDocker} size="6rem" color="#0db7ed" />
            </CardBody>
            <CardFooter class="flex flex-col gap-2">
              <Button fullWidth href="https://immich.app/docs/install/docker-compose">View Instructions</Button>
            </CardFooter>
          </Card>

          <Card color="secondary" class="h-full">
            <CardHeader>
              <CardTitle>Portainer</CardTitle>
              <CardDescription>Run Immich on <Link href="https://www.portainer.io/">Portainer</Link></CardDescription>
            </CardHeader>
            <CardBody class="flex align-middle items-center justify-center ">
              <img src={portainerIcon} class="w-20" alt="Portainer logo" />
            </CardBody>
            <CardFooter>
              <Button fullWidth href="https://immich.app/docs/install/portainer">View Instructions</Button>
            </CardFooter>
          </Card>

          <Card color="secondary" class="h-full">
            <CardHeader>
              <CardTitle>Unraid</CardTitle>
              <CardDescription>Run Immich on <Link href="https://unraid.net/">Unraid</Link></CardDescription>
            </CardHeader>
            <CardBody class="flex align-middle items-center justify-center ">
              <img src={unraidIcon} class="w-24" alt="UnRaid logo" />
            </CardBody>
            <CardFooter>
              <Button fullWidth href="https://immich.app/docs/install/unraid">View Instructions</Button>
            </CardFooter>
          </Card>

          <Card color="secondary" class="h-full">
            <CardHeader>
              <CardTitle>TrueNAS SCALE</CardTitle>
              <CardDescription
                >Run Immich on <Link href="https://www.truenas.com/truenas-scale/">TrueNAS SCALE</Link></CardDescription
              >
            </CardHeader>
            <CardBody class="flex align-middle items-center justify-center ">
              <img src={truenasIcon} class="w-24" alt="TrueNAS SCALE logo" />
            </CardBody>
            <CardFooter>
              <Button fullWidth href="https://immich.app/docs/install/truenas">View Instructions</Button>
            </CardFooter>
          </Card>
        </section>
      </Stack>
    </Stack>
  </PageContent>
</AppShell>
