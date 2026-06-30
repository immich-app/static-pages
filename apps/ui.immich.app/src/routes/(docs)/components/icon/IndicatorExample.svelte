<script lang="ts">
  import { Icon, Stack, Text, type Color } from '@immich/ui';
  import { mdiBell } from '@mdi/js';

  const icon = mdiBell;
  const size = '32';

  type Item = { item: Color; label: string };

  const colors: Item[] = [
    { item: 'primary', label: 'Primary' },
    { item: 'secondary', label: 'Secondary' },
    { item: 'success', label: 'Success' },
    { item: 'info', label: 'Info' },
    { item: 'warning', label: 'Warning' },
    { item: 'danger', label: 'Danger' },
  ];
</script>

<Stack>
  {#each colors as item (item.item)}
    <div class="flex place-items-center gap-2">
      <Icon {icon} {size} indicator={item.item} />
      <Text>{item.label}</Text>
    </div>
  {/each}
</Stack>
