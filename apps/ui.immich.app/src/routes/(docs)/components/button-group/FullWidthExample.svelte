<script lang="ts">
  import { ButtonGroup } from '@immich/ui';
</script>

<ButtonGroup
  fullWidth
  size="small"
  items={[
    { value: 'rolling', label: 'Rolling' },
    { value: 'pinned', label: 'Pinned' },
  ]}
  value="rolling"
/>
