<script lang="ts">
  import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
  import { getChartColors, CHART_PALETTE } from './chart-utils';

  Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

  interface BarData {
    label: string;
    value: number;
    percentage: number;
  }

  interface Props {
    data: BarData[];
  }

  let { data }: Props = $props();
  let canvas: HTMLCanvasElement | undefined = $state();
  let chart: Chart | undefined;

  $effect(() => {
    if (!canvas || data.length === 0) return;

    const { textColor } = getChartColors();

    chart?.destroy();
    chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            data: data.map((d) => d.value),
            backgroundColor: data.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: textColor, usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 12 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const d = data[ctx.dataIndex];
                return `${d.label}: ${d.value} (${d.percentage.toFixed(1)}%)`;
              },
            },
          },
        },
      },
    });

    return () => chart?.destroy();
  });
</script>

<div style="height: 260px">
  <canvas bind:this={canvas}></canvas>
</div>
