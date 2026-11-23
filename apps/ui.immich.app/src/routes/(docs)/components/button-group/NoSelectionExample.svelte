<script lang="ts">
  import { ButtonGroup, Text, VStack } from '@immich/ui';

  let value = $state<string>();
</script>

<VStack gap={2} class="items-start">
  <ButtonGroup
    size="tiny"
    variant="outline"
    items={[
      { value: '30m', label: '30 minutes' },
      { value: '1d', label: '1 day' },
      { value: '7d', label: '7 days' },
      { value: '30d', label: '30 days' },
    ]}
    bind:value
  />
  <Text>Selected: {value ?? 'none'}</Text>
</VStack>
