<script lang="ts">
  /**
   * Pure CSS rather than Chart.js: faster for simple per-row bars, and it lets us
   * put label + count + % on one row with the bar directly underneath.
   */
  interface BarRow {
    label: string;
    value: number;
    percent: number;
    colorClass?: string;
    highlight?: boolean;
  }

  interface Props {
    rows: BarRow[];
    countLabel?: string;
    scaleTo?: 'max' | 'total';
  }

  let { rows, countLabel = 'responses', scaleTo = 'max' }: Props = $props();

  const maxValue = $derived(Math.max(1, ...rows.map((r) => r.value)));

  function widthPct(r: BarRow): number {
    if (scaleTo === 'max') {
      return maxValue > 0 ? (r.value / maxValue) * 100 : 0;
    }
    return r.percent;
  }
</script>

<div class="space-y-3">
  {#each rows as r (r.label)}
    <div>
      <div class="mb-1 flex items-baseline justify-between gap-2">
        <span class="truncate text-sm {r.highlight ? 'font-semibold text-gray-200' : 'text-gray-300'}">
          {r.label}
        </span>
        <span class="shrink-0 text-xs text-gray-400 tabular-nums">
          {r.value}
          <span class="text-gray-500">({r.percent.toFixed(1)}%)</span>
        </span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-gray-200/60 dark:bg-gray-800">
        <div
          class="h-full rounded-full transition-all duration-500 {r.colorClass ??
            (r.highlight ? 'bg-blue-400' : 'bg-blue-500/70')}"
          style="width: {widthPct(r)}%"
        ></div>
      </div>
    </div>
  {/each}
  {#if rows.length === 0}
    <p class="text-sm text-gray-500">No responses yet.</p>
  {/if}
</div>

<span class="sr-only">{rows.length} {countLabel}</span>
