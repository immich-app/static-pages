<script lang="ts">
  import { ButtonGroup, Stack } from '@immich/ui';
  import { mdiFormatAlignCenter, mdiFormatAlignLeft, mdiFormatAlignRight, mdiViewGrid, mdiViewList } from '@mdi/js';
</script>

<Stack>
  <ButtonGroup
    items={[
      { value: 'grid', label: 'Grid', icon: mdiViewGrid },
      { value: 'list', label: 'List', icon: mdiViewList },
    ]}
    value="grid"
  />
  <ButtonGroup
    aria-label="Text alignment"
    items={[
      { value: 'left', icon: mdiFormatAlignLeft, title: 'Align left' },
      { value: 'center', icon: mdiFormatAlignCenter, title: 'Align center' },
      { value: 'right', icon: mdiFormatAlignRight, title: 'Align right' },
    ]}
    value="left"
  />
</Stack>
