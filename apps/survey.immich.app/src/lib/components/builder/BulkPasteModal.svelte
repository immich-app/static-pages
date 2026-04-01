<script lang="ts">
  import { Button, Textarea } from '@immich/ui';
  import { onMount } from 'svelte';
  import type { QuestionOption } from '$lib/types';

  interface Props {
    onSubmit: (options: QuestionOption[]) => void;
    onClose: () => void;
  }

  let { onSubmit, onClose }: Props = $props();
  let text = $state('');
  let modalElement: HTMLDivElement | undefined = $state();
  let previousFocus: HTMLElement | null = null;

  const lineCount = $derived(text.split('\n').filter((l) => l.trim()).length);

  onMount(() => {
    previousFocus = document.activeElement as HTMLElement;
    const firstFocusable = modalElement?.querySelector<HTMLElement>('input, button, textarea, [tabindex]');
    firstFocusable?.focus();
    return () => previousFocus?.focus();
  });

  function handleSubmit() {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return;
    onSubmit(lines.map((l) => ({ label: l, value: l })));
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
  onkeydown={(e) => e.key === 'Escape' && onClose()}
  role="dialog"
  aria-modal="true"
  aria-labelledby="bulk-paste-title"
  tabindex="-1"
>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="absolute inset-0" onclick={onClose}></div>
  <div
    bind:this={modalElement}
    class="relative z-10 w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
  >
    <h3 id="bulk-paste-title" class="mb-1 text-lg font-semibold">Paste Options</h3>
    <p class="mb-4 text-sm text-gray-400">Enter one option per line (minimum 2).</p>

    <Textarea bind:value={text} rows={8} placeholder="Option 1&#10;Option 2&#10;Option 3&#10;..." />

    <div class="mt-4 flex items-center justify-between">
      <span class="text-xs text-gray-500">
        {lineCount} option{lineCount !== 1 ? 's' : ''}
      </span>
      <div class="flex gap-2">
        <Button variant="outline" onclick={onClose}>Cancel</Button>
        <Button color="primary" disabled={lineCount < 2} onclick={handleSubmit}>Apply</Button>
      </div>
    </div>
  </div>
</div>
