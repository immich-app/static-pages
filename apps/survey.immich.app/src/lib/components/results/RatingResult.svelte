<script lang="ts">
  import type { SurveyQuestion } from '$lib/types';
  import HorizontalBar from './HorizontalBar.svelte';
  import LowSampleNotice from './LowSampleNotice.svelte';
  import { computeRating, LOW_SAMPLE_THRESHOLD, type AnswerData } from './analytics-utils';

  interface Props {
    question: SurveyQuestion;
    answers: AnswerData[];
  }

  let { question, answers }: Props = $props();

  const scaleMax = $derived(Number(question.config?.scaleMax ?? 5));
  const stats = $derived(computeRating(answers, scaleMax));
  const lowSample = $derived(stats.total > 0 && stats.total < LOW_SAMPLE_THRESHOLD);

  // Rows for distribution bar — ordered from highest to lowest star rating so
  // "★★★★★" shows at the top.
  const rows = $derived(
    stats.distribution
      .slice()
      .reverse()
      .map((d) => ({
        label: '★'.repeat(d.star) + '☆'.repeat(scaleMax - d.star),
        value: d.count,
        percent: stats.total > 0 ? (d.count / stats.total) * 100 : 0,
        colorClass: 'bg-amber-400',
      })),
  );

  // Visual star display for the mean
  function renderStars(mean: number | null): { full: number; half: boolean; empty: number } {
    if (mean === null) return { full: 0, half: false, empty: scaleMax };
    const full = Math.floor(mean);
    const half = mean - full >= 0.25 && mean - full < 0.75;
    const fullShown = half ? full : Math.round(mean);
    return {
      full: fullShown,
      half,
      empty: scaleMax - fullShown - (half ? 1 : 0),
    };
  }

  const starBreakdown = $derived(renderStars(stats.mean));
  const fullStarIndices = $derived(Array.from({ length: starBreakdown.full }, (_, i) => i));
  const emptyStarIndices = $derived(Array.from({ length: starBreakdown.empty }, (_, i) => i));
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <div>
      <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">Average</div>
      <div class="mt-0.5 flex items-baseline gap-2">
        <span class="text-3xl font-bold text-gray-200 tabular-nums">
          {stats.mean !== null ? stats.mean.toFixed(1) : '–'}
        </span>
        <span class="text-sm text-gray-500">/ {scaleMax}</span>
      </div>
      <div class="mt-1 text-amber-400">
        {#each fullStarIndices as i (i)}
          <span class="text-lg">★</span>
        {/each}
        {#if starBreakdown.half}
          <span class="text-lg">⯨</span>
        {/if}
        {#each emptyStarIndices as i (i)}
          <span class="text-lg text-gray-600">★</span>
        {/each}
      </div>
    </div>

    <div>
      <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">Satisfaction</div>
      <div class="mt-0.5 text-2xl font-bold text-green-400 tabular-nums">
        {stats.topBoxPct.toFixed(0)}%
      </div>
      <div class="mt-0.5 text-[11px] text-gray-500">
        rated {scaleMax >= 5 ? `${scaleMax - 1}+ stars` : `${scaleMax} stars`}
      </div>
    </div>

    <div>
      <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">Responses</div>
      <div class="mt-0.5 text-2xl font-bold text-gray-200 tabular-nums">{stats.total}</div>
    </div>
  </div>

  {#if lowSample}
    <LowSampleNotice count={stats.total} threshold={LOW_SAMPLE_THRESHOLD} metricName="rating average" />
  {/if}

  {#if stats.total > 0}
    <HorizontalBar {rows} countLabel="ratings" />
  {:else}
    <p class="text-sm text-gray-500">No responses yet.</p>
  {/if}
</div>
