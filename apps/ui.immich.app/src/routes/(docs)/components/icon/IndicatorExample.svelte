<script lang="ts">
  import ComponentColors from '$lib/components/ComponentColors.svelte';
  import { Icon, Stack, Text } from '@immich/ui';
  import { mdiBell } from '@mdi/js';

  const icon = mdiBell;
  const size = '32';
</script>

<Stack>
  <ComponentColors>
    {#snippet child({ label, color })}
      <div class="flex place-items-center gap-2">
        <Icon {icon} {size} indicator={color} />
        <Text>{label}</Text>
      </div>
    {/snippet}
  </ComponentColors>
</Stack>
