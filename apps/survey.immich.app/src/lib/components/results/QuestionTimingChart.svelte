<script lang="ts">
  import type { Chart as ChartType } from 'chart.js';
  import type { QuestionTimingEntry } from '$lib/types';
  import { getChartColors } from './chart-utils';

  interface Props {
    data: QuestionTimingEntry[];
  }

  let { data }: Props = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let chart: ChartType | undefined;

  function formatDuration(ms: number | null): string {
    if (ms === null || !Number.isFinite(ms)) return '–';
    if (ms < 1000) return `${ms}ms`;
    const secs = Math.round(ms / 100) / 10;
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remSec = Math.round(secs - mins * 60);
    return remSec === 0 ? `${mins}m` : `${mins}m ${remSec}s`;
  }

  function truncate(text: string, max = 60): string {
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }

  const containerHeight = $derived(Math.max(180, data.length * 34 + 50));

  $effect(() => {
    if (!canvas || data.length === 0) {
      chart?.destroy();
      chart = undefined;
      return;
    }

    const { isDark, textColor, gridColor } = getChartColors();
    const barColor = isDark ? 'rgba(168, 85, 247, 0.75)' : 'rgba(147, 51, 234, 0.8)';

    // Snapshot for the async closure.
    const rows = data;
    const labels = rows.map((r, i) => `Q${i + 1}: ${truncate(r.questionText, 50)}`);
    const values = rows.map((r) => (r.medianMs ?? 0) / 1000); // show in seconds

    (async () => {
      const { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } = await import('chart.js');
      Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

      chart?.destroy();
      chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Median time',
              data: values,
              backgroundColor: barColor,
              borderRadius: 4,
              barThickness: 20,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items) => rows[items[0].dataIndex]?.questionText ?? '',
                label: (ctx) => {
                  const row = rows[ctx.dataIndex];
                  if (!row) return '';
                  const sample = `${row.sampleSize} ${row.sampleSize === 1 ? 'answer' : 'answers'}`;
                  return [`Median: ${formatDuration(row.medianMs)}`, `Mean:   ${formatDuration(row.meanMs)}`, sample];
                },
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                color: textColor,
                callback: (value) => `${value}s`,
              },
              grid: { color: gridColor },
            },
            y: {
              ticks: { color: textColor, font: { size: 11 } },
              grid: { display: false },
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
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-base font-semibold">Time per Question</h3>
    {#if data.length > 0}
      <span class="text-[11px] text-gray-500">Median seconds spent on each question</span>
    {/if}
  </div>
  {#if data.length === 0}
    <p class="py-8 text-center text-sm text-gray-500">
      No per-question timing data yet — timings are collected for new responses once this feature is live.
    </p>
  {:else}
    <div style="height: {containerHeight}px">
      <canvas bind:this={canvas}></canvas>
    </div>
  {/if}
</div>
