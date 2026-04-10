<script lang="ts">
  import type { SurveyQuestion } from '$lib/types';
  import StatStrip from './StatStrip.svelte';
  import { computeNgrams, computeTextStats, type AnswerData } from './analytics-utils';

  interface Props {
    question: SurveyQuestion;
    answers: AnswerData[];
    /** Called when the user wants to browse all individual responses. */
    onViewAllResponses?: () => void;
  }

  let { question, answers, onViewAllResponses }: Props = $props();

  const SAMPLE_SIZE = 5;
  const TEXTAREA_PREVIEW_CHARS = 240;

  const isTextarea = $derived(question.type === 'textarea');

  const textStats = $derived(computeTextStats(answers));
  const ngrams = $derived(computeNgrams(answers, 12));

  interface SampleEntry {
    text: string;
    count: number;
  }

  /**
   * Unique responses with their combined counts. Used to build the sample so
   * the summary never shows the same answer twice in a row.
   */
  const uniqueResponses = $derived.by<SampleEntry[]>(() => {
    const counts: Record<string, number> = {};
    const order: string[] = [];
    for (const a of answers) {
      const text = a.value.trim();
      if (!text) continue;
      if (counts[text] === undefined) {
        counts[text] = 0;
        order.push(text);
      }
      counts[text] += a.count;
    }
    return order.map((text) => ({ text, count: counts[text] }));
  });

  /**
   * Small curated sample — the 5 most substantive responses. Ranked by
   * submission count first (duplicates are a signal the answer resonates)
   * then by text length (longer usually = more substantive).
   */
  const sample = $derived.by<SampleEntry[]>(() =>
    [...uniqueResponses].sort((a, b) => b.count - a.count || b.text.length - a.text.length).slice(0, SAMPLE_SIZE),
  );

  const totalVisible = $derived(textStats.total);
  const uniqueCount = $derived(uniqueResponses.length);
  const hasMore = $derived(uniqueCount > sample.length);

  interface StatEntry {
    label: string;
    value: string;
    tone?: 'default' | 'positive' | 'negative' | 'warning';
    hint?: string;
  }

  const stats = $derived.by<StatEntry[]>(() => {
    const base: StatEntry[] = [
      { label: 'Responses', value: String(textStats.total) },
      { label: 'Avg length', value: `${textStats.avgLength} chars` },
    ];
    if (textStats.blankCount > 0) {
      base.push({
        label: 'Blank',
        value: String(textStats.blankCount),
        tone: 'warning',
      });
    }
    return base;
  });

  const maxNgramCount = $derived(Math.max(1, ...ngrams.map((n) => n.count)));
</script>

<div class="space-y-5">
  <StatStrip {stats} />

  {#if ngrams.length > 0}
    <!-- Common phrases (bigrams/trigrams) -->
    <div>
      <div class="mb-2 text-[10px] font-medium tracking-wider text-gray-500 uppercase">Common phrases</div>
      <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {#each ngrams as ng (ng.phrase)}
          <div class="flex items-center gap-3">
            <span class="min-w-0 flex-1 truncate text-xs text-gray-300">{ng.phrase}</span>
            <div class="h-1.5 w-20 overflow-hidden rounded-full bg-gray-800">
              <div class="h-full bg-purple-500/70" style="width: {(ng.count / maxNgramCount) * 100}%"></div>
            </div>
            <span class="w-8 shrink-0 text-right text-xs text-gray-400 tabular-nums">{ng.count}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Curated sample of responses. The full list lives in the Responses tab. -->
  {#if sample.length > 0}
    <div>
      <div class="mb-2 flex items-center justify-between gap-2">
        <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">Sample responses</div>
        <span class="text-[11px] text-gray-500 tabular-nums">
          {sample.length} of {uniqueCount} unique
        </span>
      </div>
      <div class="space-y-1.5">
        {#each sample as r, i (i)}
          <div class="rounded-md bg-gray-100/60 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800/60 dark:text-gray-200">
            {#if isTextarea && r.text.length > TEXTAREA_PREVIEW_CHARS}
              <details>
                <summary class="cursor-pointer list-none">
                  <span>{r.text.slice(0, TEXTAREA_PREVIEW_CHARS)}…</span>
                  <span class="text-[11px] text-gray-500"> show more</span>
                </summary>
                <p class="mt-2 whitespace-pre-wrap">{r.text}</p>
              </details>
            {:else}
              <span class="whitespace-pre-wrap">{r.text}</span>
            {/if}
            {#if r.count > 1}
              <span
                class="ml-1 inline-flex items-center rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-300 tabular-nums"
                title="Submitted by {r.count} respondents"
              >
                ×{r.count}
              </span>
            {/if}
          </div>
        {/each}
      </div>
      {#if hasMore || totalVisible > sample.length}
        <div class="mt-3 flex items-center justify-between text-[11px] text-gray-500">
          <span>
            Showing {sample.length} of {totalVisible} total
            {totalVisible === 1 ? 'response' : 'responses'}
          </span>
          {#if onViewAllResponses}
            <button
              type="button"
              class="rounded-md border border-gray-300 px-2 py-1 text-[11px] text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-500 dark:border-gray-700 dark:text-gray-400"
              onclick={onViewAllResponses}
            >
              Browse all in Responses tab →
            </button>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <p class="text-sm text-gray-500">No responses yet.</p>
  {/if}
</div>
