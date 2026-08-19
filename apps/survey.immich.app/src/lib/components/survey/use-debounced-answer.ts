import { getContext, onDestroy } from 'svelte';

/**
 * Registers with the survey loader's pre-flush hook (via Svelte context) so a
 * pending value lands in the answer buffer before `beforeunload` fires its
 * sendBeacon; also flushes on destroy for normal navigation.
 */
export function useDebouncedAnswer(
  getLatestValue: () => string,
  onAnswer: (value: string) => void,
): { handleInput: () => void } {
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const ctx = getContext<
    | {
        registerPreFlush: (h: () => void) => void;
        unregisterPreFlush: (h: () => void) => void;
      }
    | undefined
  >('survey-pre-flush');

  function flush() {
    if (debounceTimer === undefined) {
    	return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = undefined;
    onAnswer(getLatestValue());
  }

  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      onAnswer(getLatestValue());
    }, 300);
  }

  ctx?.registerPreFlush(flush);

  onDestroy(() => {
    ctx?.unregisterPreFlush(flush);
    flush();
  });

  return { handleInput };
}
