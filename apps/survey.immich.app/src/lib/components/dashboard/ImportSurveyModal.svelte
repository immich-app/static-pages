<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiClose, mdiFileUploadOutline } from '@mdi/js';
  import { onMount } from 'svelte';

  interface Props {
    onImport: (definition: unknown) => void;
    onClose: () => void;
  }

  let { onImport, onClose }: Props = $props();

  let jsonText = $state('');
  let parseError = $state<string | null>(null);
  let importing = $state(false);
  let fileInput = $state<HTMLInputElement | null>(null);
  let modalElement: HTMLDivElement | undefined = $state();
  let previousFocus: HTMLElement | null = null;

  onMount(() => {
    previousFocus = document.activeElement as HTMLElement;
    const firstFocusable = modalElement?.querySelector<HTMLElement>('input, button, textarea, [tabindex]');
    firstFocusable?.focus();
    return () => previousFocus?.focus();
  });

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      jsonText = (e.target?.result as string) ?? '';
      parseError = null;
    };
    reader.readAsText(file);
  }

  function handleImport() {
    parseError = null;
    if (!jsonText.trim()) {
      parseError = 'Please provide a JSON definition';
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      parseError = 'Invalid JSON format';
      return;
    }

    const def = parsed as Record<string, unknown>;
    if (!def.title || !def.sections) {
      parseError = 'Definition must include "title" and "sections" fields';
      return;
    }

    importing = true;
    onImport(parsed);
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
  onclick={handleBackdropClick}
  role="dialog"
  aria-modal="true"
  aria-labelledby="import-modal-title"
  tabindex="-1"
>
  <div
    bind:this={modalElement}
    class="mx-4 w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
  >
    <div class="mb-4 flex items-center justify-between">
      <h2 id="import-modal-title" class="text-lg font-semibold">Import Survey Definition</h2>
      <button class="rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-200" onclick={onClose}>
        <Icon icon={mdiClose} size="20" />
      </button>
    </div>

    <div class="space-y-4">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-300">Upload JSON file</label>
        <button
          class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-600 px-4 py-3 text-sm text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-200"
          onclick={() => fileInput?.click()}
        >
          <Icon icon={mdiFileUploadOutline} size="18" />
          Choose file...
        </button>
        <input
          bind:this={fileInput}
          type="file"
          accept=".json,application/json"
          class="hidden"
          onchange={handleFileSelect}
        />
      </div>

      <div>
        <label for="json-input" class="mb-1.5 block text-sm font-medium text-gray-300">Or paste JSON</label>
        <textarea
          id="json-input"
          bind:value={jsonText}
          rows="10"
          class="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 font-mono text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          placeholder={'{"version": 1, "title": "My Survey", "sections": [...]}'}
        ></textarea>
      </div>

      {#if parseError}
        <p class="text-sm text-red-400">{parseError}</p>
      {/if}

      <div class="flex justify-end gap-2">
        <button
          class="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          onclick={onClose}
        >
          Cancel
        </button>
        <button
          class="bg-immich-primary rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110 disabled:opacity-50"
          disabled={importing || !jsonText.trim()}
          onclick={handleImport}
        >
          {importing ? 'Importing...' : 'Import'}
        </button>
      </div>
    </div>
  </div>
</div>
