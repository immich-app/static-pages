<script lang="ts">
  import ComponentVariants from '#lib/components/ComponentVariants.svelte';
  import { ButtonGroup, Stack, Text } from '@immich/ui';

  const items = [
    { value: 'all', label: 'All' },
    { value: 'owned', label: 'Owned' },
    { value: 'shared', label: 'Shared' },
  ];
</script>

<Stack>
  <ComponentVariants>
    {#snippet child({ variant, label })}
      <div>
        <Text class="mb-1" fontWeight="bold">{label}</Text>
        <ButtonGroup {variant} {items} value="all" />
      </div>
    {/snippet}
  </ComponentVariants>
</Stack>
