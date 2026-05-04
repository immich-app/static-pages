<script lang="ts">
  import ComponentColors from '$lib/components/ComponentColors.svelte';
  import { Button, HStack } from '@immich/ui';
</script>

<HStack wrap>
  <ComponentColors>
    {#snippet child({ color, label })}
      <Button {color} variant="outline">{label}</Button>
    {/snippet}
  </ComponentColors>
</HStack>
