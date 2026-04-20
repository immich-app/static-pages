<script lang="ts">
  import type { DropoffDataPoint } from '$lib/types';

  interface Props {
    data: DropoffDataPoint[];
  }

  let { data }: Props = $props();

  /**
   * Anchor every bar's width to the first-question respondent count (100%).
   * This gives a proper funnel: each row visually narrows relative to the
   * starting cohort, so drop-off jumps are obvious at a glance.
   */
  const startingCohort = $derived(data[0]?.respondentsReached ?? data[0]?.respondentsAnswered ?? 0);

  function widthPct(value: number): number {
    if (startingCohort <= 0) return 0;
    return Math.max(1, Math.min(100, (value / startingCohort) * 100));
  }

  function severityClass(rate: number): string {
    if (rate >= 30) return 'bg-red-500/70';
    if (rate >= 15) return 'bg-amber-500/70';
    return 'bg-emerald-500/70';
  }

  function severityText(rate: number): string {
    if (rate >= 30) return 'text-red-400';
    if (rate >= 15) return 'text-amber-400';
    return 'text-emerald-400';
  }

  function retainedPct(row: DropoffDataPoint): number {
    if (startingCohort <= 0) return 0;
    return Math.round((row.respondentsReached / startingCohort) * 100);
  }

  function skippedFor(row: DropoffDataPoint): number {
    return Math.max(0, row.respondentsReached - row.respondentsAnswered);
  }
</script>

<div class="rounded-xl border border-gray-300 p-5 dark:border-gray-600">
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-base font-semibold">Drop-off Analysis</h3>
    {#if data.length > 0}
      <span class="text-[11px] text-gray-500 tabular-nums">
        {startingCohort}
        {startingCohort === 1 ? 'respondent' : 'respondents'} started
      </span>
    {/if}
  </div>
  {#if data.length === 0}
    <p class="py-8 text-center text-sm text-gray-500">No data yet</p>
  {:else}
    <div class="space-y-2">
      {#each data as row, i (row.questionId)}
        {@const pct = retainedPct(row)}
        {@const width = widthPct(row.respondentsReached)}
        {@const skipped = skippedFor(row)}
        <div class="flex items-center gap-3 text-xs">
          <span class="w-6 shrink-0 text-right font-mono text-gray-500 tabular-nums">Q{i + 1}</span>
          <div class="min-w-0 flex-1">
            <div class="mb-0.5 flex items-baseline justify-between gap-2">
              <span class="truncate text-gray-300">{row.questionText}</span>
              <span class="shrink-0 text-gray-500 tabular-nums">
                {row.respondentsReached} / {startingCohort}
                <span class="ml-1 text-gray-600">({pct}%)</span>
                {#if skipped > 0}
                  <span class="ml-1 text-gray-500" title="Reached this question but skipped it (conditional or optional)">
                    · {skipped} skipped
                  </span>
                {/if}
              </span>
            </div>
            <div class="relative h-4 overflow-hidden rounded-md bg-gray-800/40">
              <div
                class="h-full rounded-md transition-all {severityClass(row.dropoffRate)}"
                style="width: {width}%"
              ></div>
            </div>
          </div>
          <span class="w-14 shrink-0 text-right tabular-nums {severityText(row.dropoffRate)}">
            {row.dropoffRate > 0 ? '−' : ''}{row.dropoffRate}%
          </span>
        </div>
      {/each}
    </div>
    <p class="mt-3 text-[11px] text-gray-500">
      Bar width is the cohort that reached this question (respondents who answered it or any question after it).
      Percentage on the right is the drop-off from the previous step's cohort. Conditional or optional questions are
      flagged with a "skipped" count.
    </p>
  {/if}
</div>
