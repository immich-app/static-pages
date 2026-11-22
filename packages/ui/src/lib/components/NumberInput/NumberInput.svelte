<script lang="ts">
  import Input from '#lib/components/Input/Input.svelte';
  import type { NumberInputProps } from '#lib/types.js';
  import { fromNumberInputValue, toNumberInputValue } from '#lib/utilities/internal.js';

  let { value = $bindable(), color = 'secondary', size, ...props }: NumberInputProps = $props();

  // `Input` types its value as a string, but the `<input type="number">` binding needs the number itself back
  const getValue = () => toNumberInputValue(value) as unknown as string;
  const setValue = (newValue: string | number | null) => {
    value = fromNumberInputValue(newValue);
  };
</script>

<Input bind:value={getValue, setValue} {size} type="number" {color} {...props} />
