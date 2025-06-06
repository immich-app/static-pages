<script lang="ts">
  import FullPageLayout from '$lib/layouts/FullPageLayout.svelte';
  import { Button, Heading, Icon, Logo, Stack, SupporterBadge, Text } from '@immich/ui';
  import { mdiCameraEnhance } from '@mdi/js';
</script>

<FullPageLayout size="medium">
  <Stack gap={4}>
    <SupporterBadge effect="always">
      <Logo size="large" variant="icon" />
      <Heading size="large" color="primary" tag="h1">Contribute to Our Datasets</Heading>
    </SupporterBadge>
    <section>
      <div class="flex gap-4 justify-between flex-wrap lg:flex-nowrap">
        <div
          class="flex flex-col gap-4 border border-gray-300 dark:border-gray-800 w-full p-4 md:p-8 rounded-2xl bg-gray-100 dark:bg-gray-900 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20 transition-all"
        >
          <div class="hidden md:flex flex-col gap-1 text-primary">
            <Icon icon={mdiCameraEnhance} size="56" />
            <Text fontWeight="bold" size="large">EXIF Dataset</Text>
          </div>

          <Stack gap={8}>
            <Text>
              EXIF data are extended attributes that can be embedded in image files. This dataset will help improve the
              accuracy of the EXIF data display inside of.
            </Text>
            <Button href="/exif" fullWidth size="large">Contribute</Button>
          </Stack>
        </div>
      </div>
    </section>

    <Stack gap={4}>
      <Text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
        consequat.
      </Text>
    </Stack>
  </Stack>
</FullPageLayout>
