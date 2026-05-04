<script>
  import ComponentSizes from '$lib/components/ComponentSizes.svelte';
  import { Field, Input, Stack } from '@immich/ui';
</script>

<Stack>
  <ComponentSizes>
    {#snippet child({ size, label })}
      <Field {size} {label}>
        <Input placeholder={label} />
      </Field>
    {/snippet}
  </ComponentSizes>
</Stack>
