<script lang="ts">
  import { siteMetadata } from '$lib';
  import FeatureCard from '$lib/components/FeatureCard.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import type { Feature } from '$lib/types';
  import { Container, Heading, SiteMetadata, Text } from '@immich/ui';
  import {
    mdiAccountCog,
    mdiAccountMultiple,
    mdiAccountMultipleOutline,
    mdiAndroid,
    mdiApple,
    mdiArchiveOutline,
    mdiCalendarTodayOutline,
    mdiCast,
    mdiChartLine,
    mdiCloudUpload,
    mdiDatabaseOutline,
    mdiEmailOutline,
    mdiFaceRecognition,
    mdiFileMultiple,
    mdiFileOutline,
    mdiFileUploadOutline,
    mdiFolderMultiple,
    mdiForumOutline,
    mdiHeartOutline,
    mdiImageAlbum,
    mdiImageMultiple,
    mdiImageMultipleOutline,
    mdiKeyOutline,
    mdiLink,
    mdiLock,
    mdiMagnify,
    mdiMapMarkerOutline,
    mdiMapOutline,
    mdiMotionPlayOutline,
    mdiPanoramaOutline,
    mdiPlayBoxOutline,
    mdiRaw,
    mdiRotate360,
    mdiSecurity,
    mdiShare,
    mdiTagMultiple,
    mdiThemeLightDark,
    mdiTimelineOutline,
    mdiTrashCan,
    mdiTune,
    mdiWeb,
  } from '@mdi/js';

  const features: Feature[] = [
    {
      icons: [mdiApple, mdiAndroid],
      title: 'Mobile App',
      description: 'Backup photos and videos from your devices.',
    },
    {
      icons: [mdiShare],
      title: 'Sharing',
      description: 'Share your library with friends and family.',
    },
    {
      icons: [mdiFaceRecognition],
      title: 'Facial Recognition',
      description: 'Detect and group faces automatically.',
    },
    {
      icons: [mdiLink],
      title: 'Public Links',
      description: 'Create secure links for sharing specific collections.',
    },
    {
      icons: [mdiAccountMultiple],
      title: 'Multiple Users',
      description: 'Each user has their own account and devices.',
    },
    {
      icons: [mdiMotionPlayOutline],
      title: 'Motion Photos',
      description: 'Play Apple LivePhotos and Android Motion Photos.',
    },
    {
      icons: [mdiCast],
      title: 'Cast',
      description: 'Enjoy photos and videos on the big screen.',
    },
    {
      icons: [mdiLock],
      title: 'Locked Folder',
      description: 'Extra protection for sensitive media.',
    },
    {
      icons: [mdiTune],
      title: 'Built-in Editor',
      description: 'Easily adjust, crop, and rotate photos.',
    },
    {
      icons: [mdiFileMultiple],
      title: 'Duplicate Detection',
      description: 'Detect and group duplicates automatically.',
    },
    {
      icons: [mdiMagnify],
      title: 'Smart Search',
      description: 'Search using phrases like "sunset at the beach".',
    },
    {
      icons: [mdiSecurity],
      title: 'OAuth Integration',
      description: 'Integrate with 3rd party identity providers.',
    },
    {
      title: 'Timeline',
      description: 'View your photos and videos in a timeline',
      icons: [mdiTimelineOutline],
    },
    {
      title: 'Albums',
      description: 'Organize your photos and videos into albums and share them with other users',
      icons: [mdiImageAlbum],
    },
    {
      title: 'Partner Sharing',
      description: 'Share your photos and videos with one or more partners',
      icons: [mdiAccountMultipleOutline],
    },
    {
      title: 'Dark Theme',
      description: 'View Immich using a dark theme',
      icons: [mdiThemeLightDark],
    },
    {
      title: 'Map',
      description: 'View your photos and videos on a map',
      icons: [mdiMapOutline],
    },
    {
      title: 'Archive',
      description: 'Hide non-essential photos and videos from the main timeline',
      icons: [mdiArchiveOutline],
    },
    {
      title: 'Memories',
      description: 'View photos and videos taken on this day in past years',
      icons: [mdiCalendarTodayOutline],
    },
    {
      title: 'Favorites',
      description: 'Keep track of your favorite photos and videos',
      icons: [mdiHeartOutline],
    },
    {
      title: 'Slideshow',
      description: 'View your photos and videos as a slideshow',
      icons: [mdiPlayBoxOutline],
    },
    {
      title: '360° Photos',
      description: 'View your 360° photos in Immich',
      icons: [mdiRotate360],
    },
    {
      title: 'Panoramas',
      description: 'View your panoramas in Immich',
      icons: [mdiPanoramaOutline],
    },
    {
      title: 'RAW',
      description: 'View your raw, uncompressed photo and scans in Immich',
      icons: [mdiRaw],
    },
    {
      title: 'Stacks',
      description: 'Combine similar or related photos and videos into a stack',
      icons: [mdiImageMultipleOutline],
    },
    {
      title: 'Tags',
      description: 'Organize your photos and videos with hierarchal tags',
      icons: [mdiTagMultiple],
    },
    {
      title: 'Drag and Drop',
      description: 'Drag and drop photos, videos, and screenshots into Immich',
      icons: [mdiFileUploadOutline],
    },
    {
      title: 'Internationalization',
      description: 'View Immich in your preferred language and locale',
      icons: [mdiWeb],
    },
    {
      title: 'Email Notifications',
      description: 'Receive email notifications when new photos or videos are added to an album',
      icons: [mdiEmailOutline],
    },
    {
      title: 'Trash',
      description: 'Automatically delete photos and videos from the trash after a period of time',
      icons: [mdiTrashCan],
    },
    {
      title: 'Reverse Geocoding',
      description: 'View and search your photos and videos by city, state, and country names',
      icons: [mdiMapMarkerOutline],
    },
    {
      title: 'Activity & Comments',
      description: 'View activity and comments on your photos and videos',
      icons: [mdiForumOutline],
    },
    {
      title: 'External Libraries',
      description: 'Mount your photos and videos as read-only, external folder',
      icons: [mdiImageMultiple],
    },
    {
      title: 'Folder View',
      description: 'View your photos and videos in a folder structure',
      icons: [mdiFolderMultiple],
    },
    {
      title: 'Storage Template',
      description: 'Customize how your photos and videos are stored on disk',
      icons: [mdiTagMultiple],
    },
    {
      title: 'Hardware Transcoding',
      description: 'Use hardware acceleration to transcode your videos',
      icons: [mdiAccountMultiple],
    },
    {
      title: 'Database Backups',
      description: 'Automatically backup your Immich database',
      icons: [mdiDatabaseOutline],
    },
    {
      title: 'CLI Upload',
      description: 'Import photos and videos into Immich using the CLI',
      icons: [mdiCloudUpload],
    },
    {
      title: 'API Keys',
      description: 'Programmatically access your data or integrate Immich with third party services',
      icons: [mdiKeyOutline],
    },
    {
      title: 'Monitoring',
      description: 'Monitor the health of your Immich instance via Prometheus',
      icons: [mdiChartLine],
    },
    {
      title: 'User Settings',
      description: 'Customize your Immich experience',
      icons: [mdiAccountCog],
    },
    {
      title: 'XML Sidecars',
      description: 'Sync metadata to and from XMP sidecar files',
      icons: [mdiFileOutline],
    },
  ];

  const pageMetadata = {
    title: 'Features',
    description: 'Immich is packed with features!',
  };
</script>

<SiteMetadata site={siteMetadata} page={pageMetadata} />

<PageContent>
  <Container size="giant" center>
    <div class="mb-4">
      <Heading size="title" tag="h1" fontWeight="bold" class="mb-1">{pageMetadata.title}</Heading>
      <Text color="muted">{pageMetadata.description}</Text>
    </div>

    <div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {#each features as feature, i (i)}
        <FeatureCard {feature} />
      {/each}
    </div>
  </Container>
</PageContent>
