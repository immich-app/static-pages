<script lang="ts">
  import { TableOfContents, Text, type TableOfContentsItem } from '@immich/ui';

  const items: TableOfContentsItem[] = [
    { id: 'installation', text: 'Installation', level: 2 },
    { id: 'package-managers', text: 'Package managers', level: 3 },
    { id: 'from-source', text: 'From source', level: 3 },
    { id: 'configuration', text: 'Configuration', level: 2 },
    { id: 'troubleshooting', text: 'Troubleshooting', level: 2 },
  ];
</script>

<div class="flex gap-12">
  <Text class="min-w-0 grow">
    The table of contents is a sticky aside, hidden below the <code>xl</code> breakpoint. Level three headings are indented
    under level two headings.
  </Text>
  <TableOfContents {items} />
</div>
