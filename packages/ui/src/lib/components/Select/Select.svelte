<script lang="ts" generics="T extends string">
  import InternalSelect from '#lib/internal/Select.svelte';
  import type { SelectOption, SelectProps } from '#lib/types.js';

  let { onChange, onSelect, value = $bindable(), ...restProps }: SelectProps<T> = $props();

  const getValues = () => (value === null || value === undefined ? [] : [value]);

  const setValues = (values: T[]) => {
    value = values[0];
  };

  const handleChange = (values: T[]) => {
    onChange?.(values[0]);
  };

  const handleSelect = (items: SelectOption<T>[]) => {
    onSelect?.(items[0]);
  };
</script>

<InternalSelect bind:values={getValues, setValues} onChange={handleChange} onSelect={handleSelect} {...restProps} />
