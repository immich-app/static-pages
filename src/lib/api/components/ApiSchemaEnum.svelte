<script lang="ts">
  import { Stack } from '@immich/ui';

  type Props = {
    enum: unknown[];
  };

  const { enum: items }: Props = $props();
</script>

<Stack gap={2}>
  {#each items as item, i (i)}
    <code>{item}</code>
  {/each}
</Stack>
