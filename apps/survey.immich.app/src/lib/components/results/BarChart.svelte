<script lang="ts">
  import type { Chart as ChartType } from 'chart.js';
  import { getChartColors } from './chart-utils';

  interface BarData {
    label: string;
    value: number;
    percentage: number;
  }

  interface Props {
    data: BarData[];
  }

  let { data }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: ChartType | undefined;

  const containerHeight = $derived(Math.max(150, data.length * 40 + 40));

  $effect(() => {
    if (!canvas) return;

    // Access reactive data to track it
    const labels = data.map((d) => `${d.label} (${d.percentage.toFixed(1)}%)`);
    const values = data.map((d) => d.value);
    const { isDark, textColor, gridColor } = getChartColors();
    const barColor = isDark ? 'rgb(172, 203, 250)' : 'rgb(66, 80, 175)';

    (async () => {
      const { Chart, BarController, CategoryScale, LinearScale, BarElement, Tooltip } = await import('chart.js');
      Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip);

      if (chart) {
        chart.destroy();
      }

      chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: barColor,
              borderRadius: 4,
              barThickness: 24,
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
                label: (context) => {
                  const d = data[context.dataIndex];
                  return `${d.value} responses (${d.percentage.toFixed(1)}%)`;
                },
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                color: textColor,
                stepSize: 1,
              },
              grid: {
                color: gridColor,
              },
            },
            y: {
              ticks: {
                color: textColor,
                font: { size: 13 },
              },
              grid: {
                display: false,
              },
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

<div style="height: {containerHeight}px">
  <canvas bind:this={canvas}></canvas>
</div>
