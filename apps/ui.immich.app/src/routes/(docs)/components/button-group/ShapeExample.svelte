<script lang="ts">
  import { ButtonGroup, Stack, Text } from '@immich/ui';

  const items = [
    { value: 'all', label: 'All' },
    { value: 'owned', label: 'Owned' },
    { value: 'shared', label: 'Shared' },
  ];
</script>

<Stack>
  <div>
    <Text class="mb-1" fontWeight="bold">Rectangle</Text>
    <ButtonGroup shape="rectangle" {items} value="all" />
  </div>
  <div>
    <Text class="mb-1" fontWeight="bold">Semi-round</Text>
    <ButtonGroup shape="semi-round" {items} value="all" />
  </div>
  <div>
    <Text class="mb-1" fontWeight="bold">Round</Text>
    <ButtonGroup shape="round" {items} value="all" />
  </div>
</Stack>
