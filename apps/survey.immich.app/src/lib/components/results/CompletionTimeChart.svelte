<script lang="ts">
  import type { CompletionTimesPayload } from '$lib/types';
  import StatStrip from './StatStrip.svelte';

  interface Props {
    data: CompletionTimesPayload;
  }

  let { data }: Props = $props();

  function formatDuration(seconds: number | null): string {
    if (seconds === null || !Number.isFinite(seconds)) return '–';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remMin = mins % 60;
    return remMin === 0 ? `${hours}h` : `${hours}h ${remMin}m`;
  }

  const maxCount = $derived(Math.max(1, ...data.buckets.map((b) => b.count)));

  interface StatEntry {
    label: string;
    value: string;
    tone?: 'default' | 'positive' | 'negative' | 'warning';
    hint?: string;
  }

  const stats = $derived.by<StatEntry[]>(() => {
    if (data.count === 0) return [{ label: 'Sample', value: '0' }];
    return [
      { label: 'Sample', value: String(data.count), hint: 'Number of completed responses in the distribution' },
      {
        label: 'Median',
        value: formatDuration(data.median),
        tone: 'positive',
        hint: 'Middle value — less skewed by outliers',
      },
      { label: 'Mean', value: formatDuration(data.mean) },
      { label: 'Fastest', value: formatDuration(data.min) },
      { label: 'Slowest', value: formatDuration(data.max) },
    ];
  });

  /**
   * Find the bucket index that contains the median so we can highlight it
   * on the histogram. Null if no median (zero completions).
   */
  const medianBucketIndex = $derived.by(() => {
    if (data.median === null) return -1;
    for (let i = 0; i < data.buckets.length; i++) {
      const b = data.buckets[i];
      if (data.median >= b.minSeconds && (b.maxSeconds === null || data.median < b.maxSeconds)) return i;
    }
    return -1;
  });
</script>

<div class="rounded-xl border border-gray-300 p-5 dark:border-gray-600">
  <h3 class="mb-4 text-base font-semibold">Time to Complete</h3>
  <div class="space-y-4">
    <StatStrip {stats} />
    {#if data.count === 0 || data.buckets.length === 0}
      <p class="py-4 text-center text-sm text-gray-500">No completed responses yet</p>
    {:else}
      <div class="flex h-32 items-end gap-1">
        {#each data.buckets as bucket, i (i)}
          <div class="flex flex-1 flex-col items-center gap-1" title="{bucket.label}: {bucket.count} responses">
            <span class="text-[10px] text-gray-400 tabular-nums">{bucket.count > 0 ? bucket.count : ''}</span>
            <div class="flex w-full flex-1 items-end">
              <div
                class="w-full rounded-t transition-all {i === medianBucketIndex
                  ? 'bg-emerald-400/80'
                  : 'bg-blue-500/70'}"
                style="height: {(bucket.count / maxCount) * 100}%"
              ></div>
            </div>
            <span class="text-[10px] text-gray-500">{bucket.label}</span>
          </div>
        {/each}
      </div>
      <p class="text-[11px] text-gray-500">
        Distribution of how long respondents took from starting the survey to hitting submit. The green bar is the
        bucket containing the median.
      </p>
    {/if}
  </div>
</div>
