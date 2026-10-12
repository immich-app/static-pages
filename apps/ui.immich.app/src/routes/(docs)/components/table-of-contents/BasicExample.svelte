<script lang="ts">
  import Lorem from '$lib/components/Lorem.svelte';
  import { Heading, TableOfContents, Text, type TableOfContentsItem } from '@immich/ui';

  const items: TableOfContentsItem[] = [
    { id: 'installation', text: 'Installation', level: 2 },
    { id: 'package-managers', text: 'Package managers', level: 3 },
    { id: 'from-source', text: 'From source', level: 3 },
    { id: 'configuration', text: 'Configuration', level: 2 },
    { id: 'troubleshooting', text: 'Troubleshooting', level: 2 },
  ];
</script>

<div class="h-96 overflow-y-auto">
  <div class="flex gap-12">
    <div class="flex min-w-0 grow flex-col gap-4">
      <Text>
        The table of contents is a sticky aside, hidden below the <code>xl</code> breakpoint. Level three headings are indented
        under level two headings, and the sections currently on screen are highlighted.
      </Text>
      {#each items as item (item.id)}
        <Heading tag={item.level === 3 ? 'h3' : 'h2'} size={item.level === 3 ? 'small' : 'medium'} id={item.id}>
          {item.text}
        </Heading>
        <Text><Lorem count={item.level === 3 ? 2 : 4} /></Text>
      {/each}
    </div>
    <TableOfContents {items} />
  </div>
</div>
