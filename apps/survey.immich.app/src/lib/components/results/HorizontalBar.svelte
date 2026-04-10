<script lang="ts">
  /**
   * Lightweight horizontal bar — pure CSS, no Chart.js.
   * Far faster to render than Chart.js for simple per-row bars and gives us
   * much finer control over the label layout (label + count + % on one row,
   * bar directly underneath).
   */
  interface BarRow {
    label: string;
    value: number;
    percent: number;
    /** Optional colour override (defaults to primary) */
    colorClass?: string;
    /** Show this row with emphasised styling (e.g. top answer) */
    highlight?: boolean;
  }

  interface Props {
    rows: BarRow[];
    /** Display label suffix for count (e.g. "respondents", "responses") */
    countLabel?: string;
    /** Max width of the bar relative to the widest value (default 100% = scaled to max) */
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
        <span class="shrink-0 text-xs tabular-nums text-gray-400">
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
