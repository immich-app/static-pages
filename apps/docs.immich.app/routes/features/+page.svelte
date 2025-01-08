<script lang="ts">
  import DocsHeader from '$lib/components/DocsHeader.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import {
    Alert,
    AppShell,
    AppShellHeader,
    Button,
    Card,
    CardBody,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Heading,
    Icon,
    Link,
    Stack,
    Text,
  } from '@immich/ui';
  import {
    mdiAccountCircle,
    mdiAccountCog,
    mdiAccountMultiple,
    mdiCellphone,
    mdiChartLine,
    mdiCloud,
    mdiCloudUpload,
    mdiFaceRecognition,
    mdiFileOutline,
    mdiFolderMultiple,
    mdiImageMultiple,
    mdiMagnify,
    mdiMarker,
    mdiMotionPlayOutline,
    mdiShareVariant,
    mdiTagMultiple,
  } from '@mdi/js';

  type Feature = {
    icon: string;
    title: string;
    description: string;
  };

  const features: Feature[] = [
    {
      title: 'Automatic Backup',
      description: 'Automatically backup your photos from your phone',
      icon: mdiCloud,
    },
    {
      title: 'CLI upload',
      description: 'Import photos and videos into Immich using the CLI',
      icon: mdiCloudUpload,
    },
    {
      title: 'Facial Recognition',
      description: 'Detect faces in your photos and videos',
      icon: mdiFaceRecognition,
    },
    {
      title: 'Folder View',
      description: 'View your photos and videos in a folder structure',
      icon: mdiFolderMultiple,
    },
    {
      title: 'Hardware Transcoding',
      description: 'Use hardware acceleration to transcode your videos',
      icon: mdiAccountMultiple,
    },
    {
      title: 'External Libraries',
      description: 'Mount external libraries as read-only',
      icon: mdiImageMultiple,
    },
    {
      title: 'Mobile App',
      description: 'View your photos and videos on the go',
      icon: mdiCellphone,
    },
    {
      title: 'Monitoring',
      description: 'Monitor the health of your Immich instance via Prometheus',
      icon: mdiChartLine,
    },
    {
      title: 'Partner Sharing',
      description: 'Share your photos and videos with a partner',
      icon: mdiAccountCircle,
    },
    {
      title: 'Reverse Geocoding',
      description: 'Convert lat/long to city, state, and country names',
      icon: mdiMarker,
    },
    {
      title: 'Searching',
      description: 'Search your photos and videos with natural language',
      icon: mdiMagnify,
    },
    {
      title: 'Sharing',
      description: 'Share you photos and videos with other users, or public links',
      icon: mdiShareVariant,
    },
    {
      title: 'Motion Photos',
      description: 'View Apple Live Photos and Google Motion Photos in Immich',
      icon: mdiMotionPlayOutline,
    },
    {
      title: 'Tags',
      description: 'Organize your photos and videos with tags',
      icon: mdiTagMultiple,
    },
    {
      title: 'User Settings',
      description: 'Customize your Immich experience',
      icon: mdiAccountCog,
    },
    {
      title: 'XML Sidecars',
      description: 'Sync metadata to and from XMP sidecar files',
      icon: mdiFileOutline,
    },
  ];
</script>

<AppShell>
  <AppShellHeader>
    <DocsHeader />
  </AppShellHeader>

  <PageContent>
    <Stack gap={8}>
      <Stack>
        <Heading size="title">Features</Heading>
        <Text>Immich is packed with features!</Text>
      </Stack>

      <Alert color="info" title="Info">
        <Text
          >Take a look at our <Link href="/roadmap">public roadmap</Link> for a list of upcoming features and plans</Text
        >
      </Alert>

      <Stack gap={2}>
        <section class="grid auto-rows-fr grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each features as feature}
            <Card color="secondary" class="h-full">
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardBody class="flex align-middle items-center justify-center text-primary">
                <Icon icon={feature.icon} size="3rem" class="m-5" />
              </CardBody>
              <CardFooter>
                <Button color="primary" fullWidth href="">Learn More</Button>
              </CardFooter>
            </Card>
          {/each}
        </section>
      </Stack>
    </Stack>
  </PageContent>
</AppShell>
