<script lang="ts">
  import ComponentSizes from '#lib/components/ComponentSizes.svelte';
  import { ButtonGroup, Stack, Text } from '@immich/ui';

  const items = [
    { value: 'grid', label: 'Grid' },
    { value: 'list', label: 'List' },
  ];
</script>

<Stack>
  <ComponentSizes>
    {#snippet child({ size, label })}
      <div>
        <Text class="mb-1" fontWeight="bold">{label}</Text>
        <ButtonGroup {size} {items} value="grid" />
      </div>
    {/snippet}
  </ComponentSizes>
</Stack>
