<script lang="ts">
  import Checkbox from '#lib/components/Checkbox/Checkbox.svelte';
  import Field from '#lib/components/Field/Field.svelte';
  import MultiSelect from '#lib/components/MultiSelect/MultiSelect.svelte';
  import Select from '#lib/components/Select/Select.svelte';
  import Switch from '#lib/components/Switch/Switch.svelte';

  type Props = {
    label: string;
    input: 'select' | 'multi-select' | 'switch' | 'checkbox';
    accept: boolean;
  };

  const { label, input, accept }: Props = $props();

  const options = [
    { label: 'Viewer', value: 'viewer' },
    { label: 'Remove', value: 'none' },
  ];

  let value = $state('viewer');
  let values = $state(['viewer']);
  let checked = $state(false);
</script>

<Field {label}>
  {#if input === 'select'}
    <Select bind:value={() => value, (next) => accept && next !== undefined && (value = next)} {options} />
  {:else if input === 'multi-select'}
    <MultiSelect bind:values={() => values, (next) => accept && (values = next)} {options} />
  {:else if input === 'switch'}
    <Switch bind:checked={() => checked, (next) => accept && (checked = next)} />
  {:else}
    <Checkbox bind:checked={() => checked, (next) => accept && (checked = next)} />
  {/if}
</Field>
