<script lang="ts">
  import { Button, Field, Heading, IconButton, Select, Stack, Tooltip } from '@immich/ui';
  import { mdiInformation } from '@mdi/js';

  const options = [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
  ];
</script>

<Stack gap={2}>
  <div>
    <Button title="This is a tooltip" leadingIcon={mdiInformation}>Hover me</Button>
  </div>
  <IconButton aria-label="This is a tooltip" icon={mdiInformation} />
  <Field label="Hover the select">
    <Select {options} title="This is a tooltip" />
  </Field>
  <Stack class="pbs-4">
    <Heading size="small">Customize placement and appearance</Heading>
    <Tooltip side="right" class="bg-dark-800 text-base text-dark" text="Tip">
      {#snippet child({ props })}
        <span {...props} class="w-fit rounded-lg border-2 p-1">
          Like this light, bigger tooltip, anchored to the right.
        </span>
      {/snippet}
    </Tooltip>
  </Stack>
</Stack>
