<script>
  import Checkbox from '#lib/components/Checkbox/Checkbox.svelte';
  import Field from '#lib/components/Field/Field.svelte';

  const { label } = $props();
</script>

<Field {label}>
  <Checkbox />
</Field>
