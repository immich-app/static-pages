<script lang="ts">
  import type { Chart as ChartType } from 'chart.js';
  import type { CompletionTimesPayload } from '$lib/types';
  import StatStrip from './StatStrip.svelte';
  import { getChartColors } from './chart-utils';

  interface Props {
    data: CompletionTimesPayload;
  }

  let { data }: Props = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let chart: ChartType | undefined;

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

  /** Bucket index containing the median — highlighted in the chart. */
  const medianBucketIndex = $derived.by(() => {
    if (data.median === null) return -1;
    for (let i = 0; i < data.buckets.length; i++) {
      const b = data.buckets[i];
      if (data.median >= b.minSeconds && (b.maxSeconds === null || data.median < b.maxSeconds)) return i;
    }
    return -1;
  });

  $effect(() => {
    if (!canvas || data.buckets.length === 0 || data.count === 0) {
      chart?.destroy();
      chart = undefined;
      return;
    }

    const { isDark, textColor, gridColor } = getChartColors();
    const defaultColor = isDark ? 'rgba(96, 165, 250, 0.75)' : 'rgba(59, 130, 246, 0.8)';
    const medianColor = isDark ? 'rgba(74, 222, 128, 0.9)' : 'rgba(16, 185, 129, 0.9)';

    // Snapshot for the async closure so stale re-runs don't mix arrays.
    const buckets = data.buckets;
    const medianIdx = medianBucketIndex;

    (async () => {
      const { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } = await import('chart.js');
      Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

      chart?.destroy();
      chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: buckets.map((b) => b.label),
          datasets: [
            {
              label: 'Respondents',
              data: buckets.map((b) => b.count),
              backgroundColor: buckets.map((_, i) => (i === medianIdx ? medianColor : defaultColor)),
              borderRadius: 4,
              borderSkipped: false,
              categoryPercentage: 0.85,
              barPercentage: 0.9,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items) => items[0].label,
                label: (ctx) => `${ctx.parsed.y} ${ctx.parsed.y === 1 ? 'respondent' : 'respondents'}`,
              },
            },
          },
          scales: {
            x: {
              ticks: { color: textColor, font: { size: 11 } },
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              ticks: { color: textColor, precision: 0 },
              grid: { color: gridColor },
            },
          },
        },
      });
    })();

    return () => {
      chart?.destroy();
      chart = undefined;
    };
  });
</script>

<div class="rounded-xl border border-gray-300 p-5 dark:border-gray-600">
  <h3 class="mb-4 text-base font-semibold">Time to Complete</h3>
  <div class="space-y-4">
    <StatStrip {stats} />
    {#if data.count === 0 || data.buckets.length === 0}
      <p class="py-8 text-center text-sm text-gray-500">No completed responses yet</p>
    {:else}
      <div style="height: 200px">
        <canvas bind:this={canvas}></canvas>
      </div>
      <p class="text-[11px] text-gray-500">
        Distribution of how long respondents took from starting the survey to hitting submit. The green bar is the
        bucket containing the median.
      </p>
    {/if}
  </div>
</div>
