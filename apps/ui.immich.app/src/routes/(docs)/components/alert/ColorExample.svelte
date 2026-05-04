<script lang="ts">
  import ComponentColors from '$lib/components/ComponentColors.svelte';
  import Lorem from '$lib/components/Lorem.svelte';
  import { Alert, Stack } from '@immich/ui';
</script>

<Stack gap={4}>
  <Stack gap={2}>
    <ComponentColors>
      {#snippet child({ color })}
        <Alert {color} title="This is an alert" />
        <Alert {color}>
          <p>This is an alert</p>
        </Alert>
        <Alert {color} title="This is a {color} alert">
          <Lorem />
        </Alert>
      {/snippet}
    </ComponentColors>
  </Stack>
</Stack>
