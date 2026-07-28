<script lang="ts">
  import { getLocale } from '$lib/state/locale-state.svelte.js';
  import { getByteUnitString } from '$lib/utilities/byte-units.js';

  type Props = {
    bytes: number;
    precision?: number;
    variant?: 'short' | 'narrow';
  };

  const { bytes, precision, variant = 'short' }: Props = $props();

  const separator = $derived(variant === 'narrow' ? '' : ' ');
  const value = $derived(getByteUnitString(bytes, getLocale(), precision, separator));
</script>

<span>{value}</span>
