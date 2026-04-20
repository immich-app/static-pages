<script lang="ts">
  import type { Chart as ChartType } from 'chart.js';
  import { getChartColors } from './chart-utils';
  import type { TimelineDataPoint } from '$lib/types';

  type Granularity = 'minute' | 'hour' | 'day';

  interface Props {
    data: TimelineDataPoint[];
    granularity: Granularity;
    onGranularityChange: (g: Granularity) => void;
  }

  let { data, granularity, onGranularityChange }: Props = $props();
  let canvas: HTMLCanvasElement | undefined = $state();
  let chart: ChartType | undefined;

  /**
   * Parse a DB period key into a Date. For minute-level it's "YYYY-MM-DDTHH:MM",
   * hour "YYYY-MM-DDTHH", day "YYYY-MM-DD". All are treated as UTC since that's
   * how SQLite stored them.
   */
  function parsePeriod(period: string, g: Granularity): Date {
    if (g === 'day') return new Date(`${period}T00:00:00Z`);
    if (g === 'hour') return new Date(`${period}:00:00Z`);
    return new Date(`${period}:00Z`);
  }

  function formatPeriod(d: Date, g: Granularity): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = d.getUTCFullYear();
    const m = pad(d.getUTCMonth() + 1);
    const day = pad(d.getUTCDate());
    const h = pad(d.getUTCHours());
    const min = pad(d.getUTCMinutes());
    if (g === 'day') return `${y}-${m}-${day}`;
    if (g === 'hour') return `${y}-${m}-${day}T${h}`;
    return `${y}-${m}-${day}T${h}:${min}`;
  }

  function stepMs(g: Granularity): number {
    if (g === 'day') return 24 * 60 * 60 * 1000;
    if (g === 'hour') return 60 * 60 * 1000;
    return 60 * 1000;
  }

  /**
   * Fill in missing periods between the first and last data point with
   * zero-valued entries, so a survey that has one response every 10 minutes
   * at hour granularity still renders as a proper line across the time axis
   * instead of a single dot on the left.
   *
   * Also anchors the range to "now" on the right-hand side so an active
   * survey always shows up to the present, and to at most a reasonable
   * lookback window on the left.
   */
  function fillGaps(points: TimelineDataPoint[], g: Granularity): TimelineDataPoint[] {
    if (points.length === 0) return [];
    const step = stepMs(g);
    const firstReal = parsePeriod(points[0].period, g).getTime();
    const lastReal = parsePeriod(points[points.length - 1].period, g).getTime();

    // Round "now" down to the current bucket boundary (UTC-aligned to the
    // UNIX epoch — matches how SQLite groups periods via substr on the ISO
    // timestamp). Pure integer math, no mutable Date instance.
    const nowMs = Math.floor(Date.now() / step) * step;
    const tail = Math.max(lastReal, nowMs);

    // Cap the fill range so long-lived surveys don't render 10k minute buckets.
    // 180 points is roughly 3h of minutes, 1 week of hours, 6 months of days.
    const maxPoints = 180;
    const span = (tail - firstReal) / step + 1;
    const head = span > maxPoints ? tail - (maxPoints - 1) * step : firstReal;

    const byKey: Record<string, TimelineDataPoint> = {};
    for (const p of points) byKey[p.period] = p;

    const filled: TimelineDataPoint[] = [];
    for (let t = head; t <= tail; t += step) {
      const key = formatPeriod(new Date(t), g);
      const existing = byKey[key];
      filled.push(existing ?? { period: key, started: 0, completed: 0 });
    }
    return filled;
  }

  const filledData = $derived(fillGaps(data, granularity));

  function tickLabel(period: string, g: Granularity): string {
    // Compact axis label. Keeps bars readable.
    const d = parsePeriod(period, g);
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (g === 'minute') return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    if (g === 'hour') return `${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}h`;
    return `${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }

  $effect(() => {
    if (!canvas || filledData.length === 0) return;

    const { isDark, textColor, gridColor } = getChartColors();
    const startedColor = isDark ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)';
    const completedColor = isDark ? 'rgb(74, 222, 128)' : 'rgb(34, 197, 94)';

    // Snapshot for the async closure so re-runs don't reuse stale arrays.
    const points = filledData;
    const g = granularity;

    (async () => {
      const { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } =
        await import('chart.js');
      Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

      chart?.destroy();
      chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: points.map((d) => tickLabel(d.period, g)),
          datasets: [
            {
              label: 'Started',
              data: points.map((d) => d.started),
              borderColor: startedColor,
              backgroundColor: startedColor + '20',
              fill: true,
              tension: 0.25,
              pointRadius: points.length > 60 ? 0 : 2,
              pointHoverRadius: 4,
              borderWidth: 2,
            },
            {
              label: 'Completed',
              data: points.map((d) => d.completed),
              borderColor: completedColor,
              backgroundColor: completedColor + '20',
              fill: true,
              tension: 0.25,
              pointRadius: points.length > 60 ? 0 : 2,
              pointHoverRadius: 4,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'top', labels: { color: textColor, usePointStyle: true, pointStyle: 'circle' } },
            tooltip: { mode: 'index', intersect: false },
          },
          scales: {
            x: {
              ticks: {
                color: textColor,
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 10,
              },
              grid: { color: gridColor },
            },
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
    <div class="flex rounded-lg border border-gray-300 text-xs font-medium dark:border-gray-600">
      <button
        class="rounded-l-lg px-3 py-1 transition-colors {granularity === 'minute'
          ? 'bg-gray-200 dark:bg-gray-700'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
        onclick={() => onGranularityChange('minute')}>Minute</button
      >
      <button
        class="border-x border-gray-300 px-3 py-1 transition-colors dark:border-gray-600 {granularity === 'hour'
          ? 'bg-gray-200 dark:bg-gray-700'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
        onclick={() => onGranularityChange('hour')}>Hour</button
      >
      <button
        class="rounded-r-lg px-3 py-1 transition-colors {granularity === 'day'
          ? 'bg-gray-200 dark:bg-gray-700'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
        onclick={() => onGranularityChange('day')}>Day</button
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
