<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiClose, mdiArrowUp, mdiArrowDown, mdiPlus, mdiContentPaste } from '@mdi/js';
  import type { QuestionOption } from '$lib/types';
  import BulkPasteModal from './BulkPasteModal.svelte';
  import { tick } from 'svelte';

  interface Props {
    options: QuestionOption[];
    onChange: (options: QuestionOption[]) => void;
  }

  let { options, onChange }: Props = $props();

  let inputRefs: HTMLInputElement[] = [];
  let showBulkPaste = $state(false);

  function addOptionAfter(index: number) {
    const num = options.length + 1;
    const updated = [...options];
    updated.splice(index + 1, 0, { label: `Option ${num}`, value: `Option ${num}` });
    onChange(updated);
    tick().then(() => {
      inputRefs[index + 1]?.focus();
      inputRefs[index + 1]?.select();
    });
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    onChange(options.filter((_, i) => i !== index));
    tick().then(() => {
      const focusIdx = Math.min(index, options.length - 2);
      inputRefs[focusIdx]?.focus();
    });
  }

  function updateOption(index: number, label: string) {
    const updated = [...options];
    updated[index] = { label, value: label };
    onChange(updated);
  }

  function moveOption(index: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= options.length) return;
    const updated = [...options];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated);
    tick().then(() => inputRefs[target]?.focus());
  }

  function handleKeydown(e: KeyboardEvent, index: number) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addOptionAfter(index);
    } else if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '' && options.length > 2) {
      e.preventDefault();
      removeOption(index);
    } else if (e.key === 'v' && (e.ctrlKey || e.metaKey) && options.every((o) => !o.label.trim())) {
      e.preventDefault();
      showBulkPaste = true;
    }
  }

  function handleBulkPaste(newOptions: QuestionOption[]) {
    onChange(newOptions);
    showBulkPaste = false;
  }
</script>

<div class="space-y-1.5">
  <div class="flex items-center justify-between">
    <label class="text-xs font-medium tracking-wider text-gray-500 uppercase">Options</label>
    <button
      class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-300"
      onclick={() => (showBulkPaste = true)}
    >
      <Icon icon={mdiContentPaste} size="13" />
      Paste options
    </button>
  </div>
  {#each options as option, i (i)}
    <div class="group flex items-center gap-1.5">
      <span class="w-5 text-center text-xs text-gray-600">{i + 1}</span>
      <input
        bind:this={inputRefs[i]}
        class="focus:border-immich-primary dark:focus:border-immich-primary flex-1 rounded-md border border-gray-200 bg-transparent px-3 py-1.5 text-sm transition-colors outline-none dark:border-gray-700"
        value={option.label}
        oninput={(e) => updateOption(i, (e.target as HTMLInputElement).value)}
        onkeydown={(e) => handleKeydown(e, i)}
        placeholder="Option label..."
      />
      <div
        class="flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        <button
          class="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 disabled:pointer-events-none disabled:opacity-0"
          disabled={i === 0}
          onclick={() => moveOption(i, 'up')}
        >
          <Icon icon={mdiArrowUp} size="14" />
        </button>
        <button
          class="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 disabled:pointer-events-none disabled:opacity-0"
          disabled={i === options.length - 1}
          onclick={() => moveOption(i, 'down')}
        >
          <Icon icon={mdiArrowDown} size="14" />
        </button>
        <button
          class="rounded p-1 text-gray-500 hover:bg-red-500/10 hover:text-red-400 disabled:pointer-events-none disabled:opacity-0"
          disabled={options.length <= 2}
          onclick={() => removeOption(i)}
        >
          <Icon icon={mdiClose} size="14" />
        </button>
      </div>
    </div>
  {/each}
  <button
    class="mt-1 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-300"
    onclick={() => addOptionAfter(options.length - 1)}
  >
    <Icon icon={mdiPlus} size="14" />
    Add option
  </button>
  <p class="text-[11px] text-gray-600">Press Enter to add, Backspace on empty to remove</p>
</div>

{#if showBulkPaste}
  <BulkPasteModal onSubmit={handleBulkPaste} onClose={() => (showBulkPaste = false)} />
{/if}
