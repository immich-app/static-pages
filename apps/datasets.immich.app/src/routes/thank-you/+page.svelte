<script lang="ts">
  import { page } from '$app/state';
  import { Button, Logo, Text } from '@immich/ui';

  const dataset = page.url.searchParams.get('dataset');

  const datasetName = $derived.by(() => {
    switch (dataset) {
      case 'exif':
        return 'EXIF';
      default:
        return 'Unknown';
    }
  });
</script>

<div class="flex min-h-screen flex-col items-center justify-center">
  <Logo class="mb-4" size="landing" />
  <Text class="text-3xl" fontWeight="bold">Thank you for contributing!</Text>

  <Text size="large" class="mt-2" color="muted">
    Your assets have been successfully uploaded to the {datasetName} dataset.
  </Text>

  <Button href="/" class="mt-4">Go to Datasets</Button>
</div>
