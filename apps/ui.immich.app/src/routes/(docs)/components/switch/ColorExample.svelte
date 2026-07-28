<script lang="ts">
  import ComponentColors from '$lib/components/ComponentColors.svelte';
  import { Stack, Switch, Text } from '@immich/ui';
</script>

<Stack>
  <ComponentColors>
    {#snippet child({ color, label })}
      <div>
        <Text class="mb-1" fontWeight="bold">{label}</Text>
        <Switch {color} checked />
      </div>
    {/snippet}
  </ComponentColors>
</Stack>
