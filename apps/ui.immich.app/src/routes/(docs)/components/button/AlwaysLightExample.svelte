<script lang="ts">
  import ComponentColors from '$lib/components/ComponentColors.svelte';
  import { Button, HStack } from '@immich/ui';
</script>

<HStack wrap class="light">
  <ComponentColors>
    {#snippet child({ color, label })}
      <Button {color}>{label}</Button>
    {/snippet}
  </ComponentColors>
</HStack>
