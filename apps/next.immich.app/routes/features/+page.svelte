<script lang="ts">
  import DocsHeader from '$lib/components/DocsHeader.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import {
    AppShell,
    AppShellHeader,
    Card,
    CardBody,
    CardDescription,
    CardHeader,
    CardTitle,
    Heading,
    Icon,
    Stack,
    Text,
  } from '@immich/ui';
  import {
    mdiAccountCog,
    mdiAccountMultiple,
    mdiAccountMultipleOutline,
    mdiAccountPlusOutline,
    mdiArchiveOutline,
    mdiCalendarTodayOutline,
    mdiCellphone,
    mdiChartLine,
    mdiCloudUpload,
    mdiDatabaseOutline,
    mdiEmailOutline,
    mdiFaceRecognition,
    mdiFileOutline,
    mdiFileUploadOutline,
    mdiFolderMultiple,
    mdiForumOutline,
    mdiHeartOutline,
    mdiImageAlbum,
    mdiImageMultiple,
    mdiImageMultipleOutline,
    mdiKeyOutline,
    mdiMagnify,
    mdiMapMarkerOutline,
    mdiMapOutline,
    mdiMotionPlayOutline,
    mdiPanoramaOutline,
    mdiPlayBoxOutline,
    mdiRaw,
    mdiRotate360,
    mdiSecurity,
    mdiShareVariant,
    mdiTagMultiple,
    mdiThemeLightDark,
    mdiTimelineOutline,
    mdiWeb,
  } from '@mdi/js';

  type Feature = {
    icon: string;
    title: string;
    description: string;
  };

  const features: Feature[] = [
    {
      title: 'Mobile App',
      description: 'View your photos and videos on the go',
      icon: mdiCellphone,
    },
    {
      title: 'Timeline',
      description: 'View your photos and videos in a timeline',
      icon: mdiTimelineOutline,
    },
    {
      title: 'Albums',
      description: 'Organize your photos and videos into albums and share them with other users',
      icon: mdiImageAlbum,
    },
    {
      title: 'Multi-User',
      description: 'Add friends and family to your instance, each with their own private set of photos and videos',
      icon: mdiAccountPlusOutline,
    },
    {
      title: 'Shared Links',
      description: 'Share your photos and videos with private, secure, and optionally password protected links',
      icon: mdiShareVariant,
    },
    {
      title: 'Partner Sharing',
      description: 'Share your photos and videos with one or more partners',
      icon: mdiAccountMultipleOutline,
    },
    {
      title: 'Dark Theme',
      description: 'View Immich using a dark theme',
      icon: mdiThemeLightDark,
    },
    {
      title: 'Facial Recognition',
      description: 'Detect faces in your photos and videos',
      icon: mdiFaceRecognition,
    },
    {
      title: 'Map',
      description: 'View your photos and videos on a map',
      icon: mdiMapOutline,
    },
    {
      title: 'Archive',
      description: 'Hide non-essential photos and videos from the main timeline',
      icon: mdiArchiveOutline,
    },
    {
      title: 'Memories',
      description: 'View photos and videos taken on this day in past years',
      icon: mdiCalendarTodayOutline,
    },
    {
      title: 'Favorites',
      description: 'Keep track of your favorite photos and videos',
      icon: mdiHeartOutline,
    },
    {
      title: 'Smart Search',
      description: 'Search your photos and videos with natural language',
      icon: mdiMagnify,
    },
    {
      title: 'Slideshow',
      description: 'View your photos and videos as a slideshow',
      icon: mdiPlayBoxOutline,
    },
    {
      title: 'Live Photos',
      description: 'View Live Photos from Apple devices',
      icon: mdiMotionPlayOutline,
    },
    {
      title: 'Motion Photos',
      description: 'View Motion PHotos from Android devices',
      icon: mdiMotionPlayOutline,
    },
    {
      title: '360° Photos',
      description: 'View your 360° photos in Immich',
      icon: mdiRotate360,
    },
    {
      title: 'Panoramas',
      description: 'View your panoramas in Immich',
      icon: mdiPanoramaOutline,
    },
    {
      title: 'RAW',
      description: 'View your raw, uncompressed photo and scans in Immich',
      icon: mdiRaw,
    },
    {
      title: 'Stacks',
      description: 'Combine similar or related photos and videos into a stack',
      icon: mdiImageMultipleOutline,
    },
    {
      title: 'Tags',
      description: 'Organize your photos and videos with hierarchal tags',
      icon: mdiTagMultiple,
    },
    {
      title: 'Drag and Drop',
      description: 'Drag and drop photos, videos, and screenshots into Immich',
      icon: mdiFileUploadOutline,
    },
    {
      title: 'Internationalization',
      description: 'View Immich in your preferred language and locale',
      icon: mdiWeb,
    },
    {
      title: 'Email Notifications',
      description: 'Receive email notifications when new photos or videos are added to an album',
      icon: mdiEmailOutline,
    },
    {
      title: 'Trash',
      description: 'Automatically delete photos and videos from the trash after a period of time',
      icon: mdiTagMultiple,
    },
    {
      title: 'Reverse Geocoding',
      description: 'View and search your photos and videos by city, state, and country names',
      icon: mdiMapMarkerOutline,
    },
    {
      title: 'Activity & Comments',
      description: 'View activity and comments on your photos and videos',
      icon: mdiForumOutline,
    },
    {
      title: 'External Libraries',
      description: 'Mount your photos and videos as read-only, external folder',
      icon: mdiImageMultiple,
    },
    {
      title: 'Folder View',
      description: 'View your photos and videos in a folder structure',
      icon: mdiFolderMultiple,
    },
    {
      title: 'Storage Template',
      description: 'Customize how your photos and videos are stored on disk',
      icon: mdiTagMultiple,
    },

    {
      title: 'OIDC',
      description: 'Login to Immich using OpenID Connect',
      icon: mdiSecurity,
    },
    {
      title: 'Hardware Transcoding',
      description: 'Use hardware acceleration to transcode your videos',
      icon: mdiAccountMultiple,
    },
    {
      title: 'Database Backups',
      description: 'Automatically backup your Immich database',
      icon: mdiDatabaseOutline,
    },
    {
      title: 'CLI Upload',
      description: 'Import photos and videos into Immich using the CLI',
      icon: mdiCloudUpload,
    },
    {
      title: 'Api Keys',
      description: 'Programmatically access your data or integrate Immich with third party services',
      icon: mdiKeyOutline,
    },
    {
      title: 'Monitoring',
      description: 'Monitor the health of your Immich instance via Prometheus',
      icon: mdiChartLine,
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

  <PageContent class="mx-auto max-w-screen-lg">
    <Stack gap={8}>
      <Stack>
        <Heading size="title">Features</Heading>
        <Text>Immich is packed with features!</Text>
      </Stack>

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
            </Card>
          {/each}
        </section>
      </Stack>
    </Stack>
  </PageContent>
</AppShell>
