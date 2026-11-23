<script lang="ts">
  import ComponentColors from '#lib/components/ComponentColors.svelte';
  import { ButtonGroup, Stack, Text } from '@immich/ui';

  const items = [
    { value: 'on', label: 'On' },
    { value: 'off', label: 'Off' },
  ];
</script>

<Stack>
  <ComponentColors>
    {#snippet child({ color, label })}
      <div>
        <Text class="mb-1" fontWeight="bold">{label}</Text>
        <ButtonGroup {color} {items} value="on" />
      </div>
    {/snippet}
  </ComponentColors>
</Stack>
