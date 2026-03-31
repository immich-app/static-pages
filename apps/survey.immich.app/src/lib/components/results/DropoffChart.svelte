<script lang="ts">
  import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
  import { getChartColors } from './chart-utils';
  import type { DropoffDataPoint } from '$lib/types';

  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

  interface Props {
    data: DropoffDataPoint[];
  }

  let { data }: Props = $props();
  let canvas: HTMLCanvasElement | undefined = $state();
  let chart: Chart | undefined;

  const containerHeight = $derived(Math.max(200, data.length * 40 + 60));

  $effect(() => {
    if (!canvas || data.length === 0) return;

    const { isDark, textColor, gridColor } = getChartColors();
    const barColor = data.map((d) => {
      if (d.dropoffRate > 30) return isDark ? 'rgb(248, 113, 113)' : 'rgb(239, 68, 68)';
      if (d.dropoffRate > 15) return isDark ? 'rgb(251, 191, 36)' : 'rgb(245, 158, 11)';
      return isDark ? 'rgb(74, 222, 128)' : 'rgb(34, 197, 94)';
    });

    const labels = data.map((d, i) => `Q${i + 1}: ${d.questionText.length > 30 ? d.questionText.slice(0, 30) + '...' : d.questionText}`);

    chart?.destroy();
    chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: data.map((d) => d.respondentsAnswered),
          backgroundColor: barColor,
          borderRadius: 4,
          barThickness: 24,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const d = data[ctx.dataIndex];
                return `${d.respondentsAnswered} answered (${d.dropoffRate}% drop-off)`;
              },
            },
          },
        },
        scales: {
          x: { beginAtZero: true, ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
          y: { ticks: { color: textColor, font: { size: 11 } }, grid: { display: false } },
        },
      },
    });

    return () => chart?.destroy();
  });
</script>

<div class="rounded-xl border border-gray-300 p-5 dark:border-gray-600">
  <h3 class="mb-4 text-base font-semibold">Drop-off Analysis</h3>
  {#if data.length === 0}
    <p class="py-8 text-center text-sm text-gray-500">No data yet</p>
  {:else}
    <div style="height: {containerHeight}px">
      <canvas bind:this={canvas}></canvas>
    </div>
  {/if}
</div>
