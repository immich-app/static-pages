<script lang="ts">
  import { HStack, Heading, Icon, Stack, Text } from '@immich/ui';
  import { mdiBell } from '@mdi/js';

  const icon = mdiBell;
  const size = '32';

  type Item = { item: string; label: string };

  const immichColors: Item[] = [
    { item: 'var(--immich-ui-primary-500)', label: 'Primary' },
    { item: 'var(--immich-ui-secondary-500)', label: 'Secondary' },
    { item: 'var(--immich-ui-success-500)', label: 'Success' },
    { item: 'var(--immich-ui-info-500)', label: 'Info' },
    { item: 'var(--immich-ui-warning-500)', label: 'Warning' },
    { item: 'var(--immich-ui-danger-500)', label: 'Danger' },
  ];

  const cssColors: Item[] = [
    { item: 'pink', label: 'Pink' },
    { item: 'green', label: 'Green' },
    { item: '#2e6dfb', label: 'RGB' },
    { item: 'hsl(356 74.5% 43.1%)', label: 'HSL' },
  ];
</script>

<HStack gap={8}>
  <Stack>
    <Heading size="tiny">Immich Colors</Heading>
    {#each immichColors as item (item.item)}
      <div class="flex place-items-center gap-2">
        <Icon {icon} {size} indicator={item.item} />
        <Text>{item.label}</Text>
      </div>
    {/each}
  </Stack>
  <Stack>
    <Heading size="tiny">CSS Colors</Heading>
    {#each cssColors as item (item.item)}
      <div class="flex place-items-center gap-2">
        <Icon {icon} {size} indicator={item.item} />
        <Text>{item.label}</Text>
      </div>
    {/each}
  </Stack>
</HStack>
