<script>
  import ComponentSizes from '$lib/components/ComponentSizes.svelte';
  import { ProgressBar, Stack, Text } from '@immich/ui';
</script>

<Stack>
  <ComponentSizes>
    {#snippet child({ size, label })}
      <div>
        <Text class="mb-1" fontWeight="bold">{label}</Text>
        <ProgressBar color="primary" progress={0.8} {size} />
      </div>
    {/snippet}
  </ComponentSizes>
</Stack>
