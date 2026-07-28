<script>
  import ComponentColors from '$lib/components/ComponentColors.svelte';
  import { HStack, ProgressBar } from '@immich/ui';
</script>

<HStack wrap>
  <ComponentColors>
    {#snippet child({ color })}
      <ProgressBar {color} progress={0.8} size="large" />
    {/snippet}
  </ComponentColors>
</HStack>
