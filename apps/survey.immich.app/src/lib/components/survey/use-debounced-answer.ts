import { getContext, onDestroy } from 'svelte';

/**
 * Creates a debounced answer handler for text-like question components.
 *
 * On each keystroke, clears the previous timer and starts a new 300ms one.
 * Registers with the survey loader's pre-flush hook (via Svelte context) so
 * that `beforeunload` flushes the pending value into the answer buffer before
 * the sendBeacon fires. Also flushes on component destroy (normal navigation).
 */
export function useDebouncedAnswer(
  getLatestValue: () => string,
  onAnswer: (value: string) => void,
): { handleInput: () => void } {
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const ctx = getContext<{ registerPreFlush: (h: () => void) => void; unregisterPreFlush: () => void } | undefined>(
    'survey-pre-flush',
  );

  function flush() {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
      onAnswer(getLatestValue());
    }
  }

  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      onAnswer(getLatestValue());
    }, 300);
  }

  // Register so beforeunload can flush us before the beacon fires
  ctx?.registerPreFlush(flush);

  onDestroy(() => {
    ctx?.unregisterPreFlush();
    flush();
  });

  return { handleInput };
}
