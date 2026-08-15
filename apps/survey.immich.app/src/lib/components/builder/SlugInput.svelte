<script lang="ts">
  import { Input } from '@immich/ui';
  import { validateSlug } from '$lib/engines/builder-engine.svelte';

  interface Props {
    value: string;
    onChange: (value: string) => void;
  }

  let { value, onChange }: Props = $props();

  const error = $derived(value ? validateSlug(value) : null);

  function handleInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    onChange(raw);
  }
</script>

<div>
  <label class="mb-1 block text-sm font-medium text-gray-400">Survey URL slug</label>
  <div class="flex items-center gap-3">
    <span class="shrink-0 text-sm text-gray-500">/s/</span>
    <Input {value} placeholder="my-survey" oninput={handleInput} />
  </div>
  {#if error}
    <p class="mt-1 text-sm text-red-400">{error}</p>
  {/if}
  {#if value && !error}
    <p class="mt-1 text-sm text-gray-500">Survey will be available at /s/{value}</p>
  {/if}
</div>
