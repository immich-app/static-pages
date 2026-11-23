<script lang="ts">
  import { ButtonGroup, Text, VStack } from '@immich/ui';

  let value = $state('day');
</script>

<VStack gap={2} class="items-start">
  <ButtonGroup
    aria-label="Time range"
    items={[
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
      { value: 'year', label: 'Year' },
    ]}
    bind:value
  />
  <Text>Selected: {value}</Text>
</VStack>
