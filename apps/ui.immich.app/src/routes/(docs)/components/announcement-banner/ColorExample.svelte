<script lang="ts">
  import ComponentTextColors from '$lib/components/ComponentTextColors.svelte';
  import { AnnouncementBanner, Link, Stack } from '@immich/ui';
</script>

<Stack>
  <ComponentTextColors>
    {#snippet child({ color })}
      <AnnouncementBanner {color}>
        Super important announcement &mdash; Read more <Link href="#">here</Link> ({color})
      </AnnouncementBanner>
    {/snippet}
  </ComponentTextColors>
</Stack>
