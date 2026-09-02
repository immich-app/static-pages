<script lang="ts">
  import { Button, Field, IconButton, Select, Stack } from '@immich/ui';
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
</Stack>
