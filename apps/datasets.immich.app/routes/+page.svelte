<script lang="ts">
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  import DefaultPageLayout from '$lib/layouts/DefaultPageLayout.svelte';
  import { Heading, Link, Stack, Text } from '@immich/ui';
  import { mdiCameraEnhance, mdiPaw } from '@mdi/js';
</script>

<DefaultPageLayout>
  <Stack gap={8}>
    <div class="flex flex-col gap-1">
      <Heading size="giant" tag="h1">Immich Datasets</Heading>
      <Text color="muted">Open, community-driven photo & video collections</Text>
    </div>

    <Stack gap={4}>
      <Heading size="medium">Active Projects</Heading>
      <div class="grid md:grid-cols-2 gap-4">
        <ProjectCard icon={mdiCameraEnhance} title="EXIF Dataset" href="/projects/exif">
          {#snippet description()}
            <Text
              ><Link href="https://en.wikipedia.org/wiki/Exif">EXIF</Link> stands for Exchangeable Image File Format. It
              is a standard that specifies the metadata that can be embedded in image files, especially those captured by
              digital cameras and smartphones.</Text
            >

            <Text
              >Help us improve this dataset by submitting photos and videos taken from a variety of devices, including
              smartphones, DSLRs, and action cameras, as well as photos with unique features, such as panoramas, burst
              photos, and photo spheres.
            </Text>
          {/snippet}
        </ProjectCard>
      </div>
    </Stack>

    <Stack gap={4}>
      <Heading>Planned Projects (Coming Soon)</Heading>
      <div class="grid md:grid-cols-2 gap-4">
        <ProjectCard icon={mdiPaw} title="Pet Dataset">
          {#snippet description()}
            <Text
              >Pet recognition models rely on training data to learn how to identify and classify different pets.
            </Text>
            <Text
              >Help us create a dataset of pet photos and videos to make it possible to recognize pets in Immich.</Text
            >
          {/snippet}
        </ProjectCard>
      </div>
    </Stack>
  </Stack>
</DefaultPageLayout>
