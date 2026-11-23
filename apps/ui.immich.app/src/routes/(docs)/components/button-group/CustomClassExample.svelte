<script lang="ts">
  import { ButtonGroup } from '@immich/ui';
</script>

<ButtonGroup
  class="border-primary/40 bg-primary/5 shadow-md"
  shape="round"
  items={[
    { value: 'photos', label: 'Photos' },
    { value: 'videos', label: 'Videos' },
  ]}
  value="photos"
/>
