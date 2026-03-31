<script lang="ts">
  import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';

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

  const COLORS = [
    'rgb(96, 165, 250)', 'rgb(74, 222, 128)', 'rgb(251, 146, 60)',
    'rgb(167, 139, 250)', 'rgb(248, 113, 113)', 'rgb(45, 212, 191)',
    'rgb(251, 191, 36)', 'rgb(244, 114, 182)', 'rgb(148, 163, 184)',
    'rgb(129, 140, 248)',
  ];

  $effect(() => {
    if (!canvas || data.length === 0) return;

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const textColor = isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)';

    chart?.destroy();
    chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.label),
        datasets: [{
          data: data.map((d) => d.value),
          backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
          borderWidth: 0,
          hoverOffset: 4,
        }],
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
