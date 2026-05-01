<script>
  import ComponentColors from '$lib/components/ComponentColors.svelte';
  import { Meter, Stack } from '@immich/ui';
</script>

<Stack>
  <ComponentColors>
    {#snippet child({ color })}
      <Meter {color} value={0.7} size="large" />
    {/snippet}
  </ComponentColors>
</Stack>
