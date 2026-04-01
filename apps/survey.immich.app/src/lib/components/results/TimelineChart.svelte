<script lang="ts">
  import type { Chart as ChartType } from 'chart.js';
  import { getChartColors } from './chart-utils';
  import type { TimelineDataPoint } from '$lib/types';

  interface Props {
    data: TimelineDataPoint[];
    granularity: 'day' | 'hour';
    onGranularityChange: (g: 'day' | 'hour') => void;
  }

  let { data, granularity, onGranularityChange }: Props = $props();
  let canvas: HTMLCanvasElement | undefined = $state();
  let chart: ChartType | undefined;

  $effect(() => {
    if (!canvas || data.length === 0) return;

    const { isDark, textColor, gridColor } = getChartColors();
    const startedColor = isDark ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)';
    const completedColor = isDark ? 'rgb(74, 222, 128)' : 'rgb(34, 197, 94)';

    (async () => {
      const { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } =
        await import('chart.js');
      Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

      chart?.destroy();
      chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: data.map((d) => d.period),
          datasets: [
            {
              label: 'Started',
              data: data.map((d) => d.started),
              borderColor: startedColor,
              backgroundColor: startedColor + '20',
              fill: true,
              tension: 0.3,
              pointRadius: 3,
            },
            {
              label: 'Completed',
              data: data.map((d) => d.completed),
              borderColor: completedColor,
              backgroundColor: completedColor + '20',
              fill: true,
              tension: 0.3,
              pointRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { color: textColor, usePointStyle: true, pointStyle: 'circle' } },
            tooltip: { mode: 'index', intersect: false },
          },
          scales: {
            x: { ticks: { color: textColor, maxRotation: 45 }, grid: { color: gridColor } },
            y: { beginAtZero: true, ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
          },
        },
      });
    })();

    return () => chart?.destroy();
  });
</script>

<div class="rounded-xl border border-gray-300 p-5 dark:border-gray-600">
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-base font-semibold">Response Timeline</h3>
    <div class="flex rounded-lg border border-gray-300 dark:border-gray-600">
      <button
        class="rounded-l-lg px-3 py-1 text-xs font-medium transition-colors {granularity === 'day'
          ? 'bg-gray-200 dark:bg-gray-700'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
        onclick={() => onGranularityChange('day')}>Day</button
      >
      <button
        class="rounded-r-lg px-3 py-1 text-xs font-medium transition-colors {granularity === 'hour'
          ? 'bg-gray-200 dark:bg-gray-700'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
        onclick={() => onGranularityChange('hour')}>Hour</button
      >
    </div>
  </div>
  {#if data.length === 0}
    <p class="py-8 text-center text-sm text-gray-500">No response data yet</p>
  {:else}
    <div style="height: 280px">
      <canvas bind:this={canvas}></canvas>
    </div>
  {/if}
</div>
