<script lang="ts">
  import type { SurveyQuestion } from '$lib/types';
  import StatStrip from './StatStrip.svelte';
  import {
    computeNgrams,
    computeTextStats,
    computeEmailStats,
    type AnswerData,
  } from './analytics-utils';

  interface Props {
    question: SurveyQuestion;
    answers: AnswerData[];
  }

  let { question, answers }: Props = $props();

  const isEmail = $derived(question.type === 'email');
  const isTextarea = $derived(question.type === 'textarea');

  const textStats = $derived(computeTextStats(answers));
  const emailStats = $derived(isEmail ? computeEmailStats(answers) : null);
  const ngrams = $derived(!isEmail ? computeNgrams(answers, 15) : []);

  // Flattened list of all responses for the paginated viewer
  const flat = $derived.by(() => {
    const out: string[] = [];
    for (const a of answers) {
      const trimmed = a.value.trim();
      if (!trimmed) continue;
      for (let i = 0; i < a.count; i++) out.push(trimmed);
    }
    return out;
  });

  const PAGE_SIZE = 10;
  let page = $state(0);
  let searchTerm = $state('');

  const filtered = $derived.by(() => {
    if (!searchTerm.trim()) return flat;
    const q = searchTerm.toLowerCase();
    return flat.filter((r) => r.toLowerCase().includes(q));
  });

  const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const pagedResponses = $derived(filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE));

  // Reset page when search changes
  $effect(() => {
    void searchTerm;
    page = 0;
  });

  interface StatEntry {
    label: string;
    value: string;
    tone?: 'default' | 'positive' | 'negative' | 'warning';
    hint?: string;
  }

  const stats = $derived.by<StatEntry[]>(() => {
    if (isEmail && emailStats) {
      return [
        { label: 'Responses', value: String(emailStats.total) },
        { label: 'Unique', value: String(emailStats.unique), tone: 'positive' },
        {
          label: 'Duplicates',
          value: String(emailStats.duplicates),
          tone: emailStats.duplicates > 0 ? 'warning' : 'default',
        },
      ];
    }
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
  const maxDomainCount = $derived(
    isEmail && emailStats ? Math.max(1, ...emailStats.topDomains.map((d) => d.count)) : 1,
  );
</script>

<div class="space-y-5">
  <StatStrip {stats} />

  {#if isEmail && emailStats && emailStats.topDomains.length > 0}
    <!-- Top email domains -->
    <div>
      <div class="mb-2 text-[10px] font-medium tracking-wider text-gray-500 uppercase">
        Top domains
      </div>
      <div class="space-y-1.5">
        {#each emailStats.topDomains as d (d.domain)}
          <div class="flex items-center gap-3">
            <span class="w-32 shrink-0 truncate text-xs text-gray-300">{d.domain}</span>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
              <div class="h-full bg-blue-500/70" style="width: {(d.count / maxDomainCount) * 100}%"></div>
            </div>
            <span class="w-10 shrink-0 text-right text-xs tabular-nums text-gray-400">{d.count}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if !isEmail && ngrams.length > 0}
    <!-- Common phrases (bigrams/trigrams) -->
    <div>
      <div class="mb-2 text-[10px] font-medium tracking-wider text-gray-500 uppercase">
        Common phrases
      </div>
      <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {#each ngrams as ng (ng.phrase)}
          <div class="flex items-center gap-3">
            <span class="min-w-0 flex-1 truncate text-xs text-gray-300">{ng.phrase}</span>
            <div class="h-1.5 w-20 overflow-hidden rounded-full bg-gray-800">
              <div class="h-full bg-purple-500/70" style="width: {(ng.count / maxNgramCount) * 100}%"></div>
            </div>
            <span class="w-8 shrink-0 text-right text-xs tabular-nums text-gray-400">{ng.count}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Paginated response list with search -->
  {#if flat.length > 0}
    <div>
      <div class="mb-2 flex items-center justify-between gap-2">
        <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">
          Responses
        </div>
        <input
          type="search"
          bind:value={searchTerm}
          placeholder="Search..."
          class="w-48 rounded-md border border-gray-700 bg-gray-900/60 px-2 py-1 text-xs text-gray-200 placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div class="space-y-1.5">
        {#each pagedResponses as r, i (page + '-' + i)}
          <div class="rounded-md bg-gray-100/60 px-3 py-2 text-sm text-gray-200 dark:bg-gray-800/60">
            {#if isTextarea && r.length > 200}
              <details>
                <summary class="cursor-pointer">
                  {r.slice(0, 200)}…
                  <span class="text-[11px] text-gray-500"> show more</span>
                </summary>
                <p class="mt-2 whitespace-pre-wrap">{r}</p>
              </details>
            {:else}
              {r}
            {/if}
          </div>
        {/each}
        {#if pagedResponses.length === 0}
          <p class="text-sm text-gray-500">No responses match "{searchTerm}".</p>
        {/if}
      </div>
      {#if totalPages > 1}
        <div class="mt-3 flex items-center justify-between text-xs text-gray-400">
          <span>
            Page {page + 1} of {totalPages} · {filtered.length}
            {filtered.length === 1 ? 'response' : 'responses'}
          </span>
          <div class="flex gap-1">
            <button
              class="rounded-md border border-gray-700 px-2 py-0.5 disabled:opacity-40"
              disabled={page === 0}
              onclick={() => (page = Math.max(0, page - 1))}
              aria-label="Previous page"
            >
              ← Prev
            </button>
            <button
              class="rounded-md border border-gray-700 px-2 py-0.5 disabled:opacity-40"
              disabled={page >= totalPages - 1}
              onclick={() => (page = Math.min(totalPages - 1, page + 1))}
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <p class="text-sm text-gray-500">No responses yet.</p>
  {/if}
</div>
