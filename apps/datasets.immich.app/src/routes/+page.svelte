<script lang="ts">
  import DefaultPageLayout from '$common/components/DefaultPageLayout.svelte';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
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
      <div class="grid gap-4 md:grid-cols-2">
        <ProjectCard icon={mdiCameraEnhance} title="EXIF Dataset" href="/projects/exif">
          {#snippet description()}
            <Text>
              <Link href="https://en.wikipedia.org/wiki/Exif">EXIF</Link>
              is a standard that specifies the metadata that can be embedded in image files.
            </Text>

            <Text>Help us improve this dataset by submitting photos and videos taken from a variety of devices.</Text>
          {/snippet}
        </ProjectCard>
        <ProjectCard icon={mdiPaw} title="Pet Dataset" href="/projects/pets">
          {#snippet description()}
            <Text
              >Pet recognition models rely on training data to learn how to identify and classify different pets.
            </Text>
            <Text
              >Help us create a dataset of pet photos and videos to make it possible to recognize pets in Immich.
            </Text>
          {/snippet}
        </ProjectCard>
      </div>
    </Stack>
  </Stack>
</DefaultPageLayout>
