<script lang="ts">
  import ComponentColors from '$lib/components/ComponentColors.svelte';
  import { HStack, IconButton } from '@immich/ui';
  import { mdiMagnify } from '@mdi/js';

  const icon = mdiMagnify;
</script>

<HStack wrap>
  <ComponentColors>
    {#snippet child({ color, label })}
      <IconButton {icon} {color} aria-label={label} disabled />
    {/snippet}
  </ComponentColors>
</HStack>
