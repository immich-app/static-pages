<script>
  import ComponentSizes from '$lib/components/ComponentSizes.svelte';
  import { LoadingSpinner, Stack, Text } from '@immich/ui';
</script>

<Stack>
  <ComponentSizes>
    {#snippet child({ size, label })}
      <div>
        <Text class="mb-1" fontWeight="bold">{label}</Text>
        <LoadingSpinner color="primary" {size} />
      </div>
    {/snippet}
  </ComponentSizes>
</Stack>
