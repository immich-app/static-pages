<script lang="ts">
  import { ButtonGroup, Stack, Text } from '@immich/ui';

  const items = [
    { value: 'jpeg', label: 'JPEG' },
    { value: 'webp', label: 'WebP' },
    { value: 'avif', label: 'AVIF', disabled: true },
  ];
</script>

<Stack>
  <div>
    <Text class="mb-1" fontWeight="bold">Item</Text>
    <ButtonGroup {items} value="jpeg" />
  </div>
  <div>
    <Text class="mb-1" fontWeight="bold">Group</Text>
    <ButtonGroup {items} value="jpeg" disabled />
  </div>
</Stack>
