<script lang="ts">
  import ComponentColors from '$lib/components/ComponentColors.svelte';
  import { Badge, Stack, Text } from '@immich/ui';
</script>

<Stack>
  <ComponentColors>
    {#snippet child({ color, label })}
      <div>
        <Text class="mb-1" fontWeight="bold">{label}</Text>
        <Badge shape="semi-round" {color}>#immich</Badge>
      </div>
    {/snippet}
  </ComponentColors>
</Stack>
