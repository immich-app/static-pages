<script lang="ts">
  import portainerIcon from '$common/img/portainer.svg';
  import truenasIcon from '$common/img/truenas-scale.svg';
  import unraidIcon from '$common/img/unraid.svg';
  import FullPageLayout from '$common/components/FullPageLayout.svelte';
  import {
    Button,
    Card,
    CardBody,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Constants,
    Heading,
    Icon,
    Link,
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

<FullPageLayout size="large">
  <Stack gap={8}>
    <SupporterBadge effect="always">
      <Logo size="large" variant="icon" />
      <Heading size="large" color="primary" tag="h1">Get Immich</Heading>
    </SupporterBadge>

    <Stack gap={2}>
      <div>
        <Heading size="large" tag="h2">Mobile Apps</Heading>
        <Text color="muted"
          >Download Immich app and start backing up your photos and videos securely to your own server</Text
        >
      </div>

      <div class="l grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card color="secondary">
          <CardHeader>
            <CardTitle>Android</CardTitle>
          </CardHeader>
          <CardBody>
            <Stack gap={4}>
              <!-- eslint-disable svelte/no-navigation-without-resolve -->
              <a href={Constants.Get.Android}>
                <img class="mx-auto h-24" alt="Get it on Google Play" src={playStoreBadge} />
              </a>
              <!-- eslint-disable svelte/no-navigation-without-resolve -->
              <a href={Constants.Get.FDroid}>
                <img class="border-dark mx-auto h-16 rounded-xl border" alt="Get it on F-Droid" src={fdroidBadge} />
              </a>
              <Button
                class="mx-auto mt-4 h-16 dark:bg-black dark:text-white"
                size="giant"
                href={Constants.Get.GithubRelease}
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
            <!-- eslint-disable svelte/no-navigation-without-resolve -->
            <a href={Constants.Get.iOS}>
              <img class="mx-auto mt-4 h-16" alt="Download on the App Store" src={appStoreBadge} />
            </a>
          </CardBody>
        </Card>
      </div>
    </Stack>

    <Stack gap={2}>
      <div>
        <Heading size="large" tag="h2">Server</Heading>
        <Text color="muted">Download, setup, and run Immich on your own server</Text>
      </div>

      <section class="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card color="secondary" class="h-full">
          <CardHeader>
            <CardTitle>Docker Compose</CardTitle>
            <CardDescription>Run Immich on <Link href="https://www.docker.com/">Docker</Link></CardDescription>
          </CardHeader>
          <CardBody class="flex items-center justify-center align-middle ">
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
          <CardBody class="flex items-center justify-center align-middle ">
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
          <CardBody class="flex items-center justify-center align-middle ">
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
          <CardBody class="flex items-center justify-center align-middle ">
            <img src={truenasIcon} class="w-24" alt="TrueNAS SCALE logo" />
          </CardBody>
          <CardFooter>
            <Button fullWidth href="https://immich.app/docs/install/truenas">View Instructions</Button>
          </CardFooter>
        </Card>
      </section>
    </Stack>
  </Stack>
</FullPageLayout>
