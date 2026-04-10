<script lang="ts">
  import LowSampleNotice from './LowSampleNotice.svelte';
  import StatStrip from './StatStrip.svelte';
  import { computeNumber, bucketNumbers, LOW_SAMPLE_THRESHOLD, type AnswerData } from './analytics-utils';

  interface Props {
    answers: AnswerData[];
  }

  let { answers }: Props = $props();

  const stats = $derived(computeNumber(answers));
  const lowSample = $derived(stats.total > 0 && stats.total < LOW_SAMPLE_THRESHOLD);
  const buckets = $derived(bucketNumbers(stats.values));
  const maxBucket = $derived(Math.max(1, ...buckets.map((b) => b.count)));

  function fmt(n: number | null, digits = 1): string {
    if (n === null) return '–';
    return Number.isInteger(n) ? String(n) : n.toFixed(digits);
  }

  const displayStats = $derived([
    { label: 'Responses', value: String(stats.total) },
    { label: 'Mean', value: fmt(stats.mean, 1), hint: 'Average of all values' },
    {
      label: 'Median',
      value: fmt(stats.median, 1),
      tone: 'positive' as const,
      hint: 'Middle value — less skewed by outliers',
    },
    { label: 'Min', value: fmt(stats.min, 0) },
    { label: 'Max', value: fmt(stats.max, 0) },
  ]);
</script>

<div class="space-y-4">
  <StatStrip stats={displayStats} />

  {#if lowSample}
    <LowSampleNotice count={stats.total} threshold={LOW_SAMPLE_THRESHOLD} metricName="distribution" />
    <!-- Show raw values as a dot list for very small samples -->
    <div class="flex flex-wrap gap-1.5">
      {#each stats.values as v, i (i + '-' + v)}
        <span class="rounded-md bg-gray-800 px-2 py-0.5 text-xs tabular-nums text-gray-300">
          {v}
        </span>
      {/each}
    </div>
  {:else if stats.total === 0}
    <p class="text-sm text-gray-500">No responses yet.</p>
  {:else}
    <!-- Histogram -->
    <div>
      <div class="flex h-32 items-end gap-1">
        {#each buckets as bucket, i (i)}
          <div
            class="flex flex-1 flex-col items-center gap-1"
            title="{bucket.label}: {bucket.count} responses"
          >
            <div class="flex w-full flex-1 items-end">
              <div
                class="w-full rounded-t bg-blue-500/70 transition-all"
                style="height: {(bucket.count / maxBucket) * 100}%"
              ></div>
            </div>
            <span class="text-[10px] text-gray-500" style="max-width: 100%">
              {bucket.label}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
