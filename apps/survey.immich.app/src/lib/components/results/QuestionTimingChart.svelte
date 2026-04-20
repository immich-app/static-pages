<script lang="ts">
  import type { QuestionTimingEntry } from '$lib/types';

  interface Props {
    data: QuestionTimingEntry[];
  }

  let { data }: Props = $props();

  function formatDuration(ms: number | null): string {
    if (ms === null || !Number.isFinite(ms)) return '–';
    if (ms < 1000) return `${ms}ms`;
    const secs = Math.round(ms / 100) / 10;
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remSec = Math.round(secs - mins * 60);
    return remSec === 0 ? `${mins}m` : `${mins}m ${remSec}s`;
  }

  /**
   * Global x-axis upper bound. Anchor to the largest p95 across all questions
   * rather than max — a single slow outlier on one question would otherwise
   * squash every other row against the left edge. Multiply by 1.05 to leave a
   * little breathing room on the right.
   */
  const xMax = $derived.by(() => {
    const p95s = data.map((q) => q.p95Ms ?? 0).filter((v) => v > 0);
    if (p95s.length === 0) return 1;
    return Math.max(...p95s) * 1.05;
  });

  /** Convert a ms value to a 0–100 percentage of the x-axis. */
  function xPct(ms: number | null): number {
    if (ms === null || !Number.isFinite(ms) || xMax <= 0) return 0;
    return Math.max(0, Math.min(100, (ms / xMax) * 100));
  }

  /**
   * Build a small set of "nice" x-axis ticks from 0 to xMax. Uses a base of
   * 1/2/5 × 10^n so the ticks land on readable values regardless of the
   * actual max.
   */
  const ticks = $derived.by(() => {
    if (xMax <= 0) return [] as Array<{ ms: number; label: string }>;
    const targetTicks = 5;
    const rough = xMax / targetTicks;
    const pow = Math.pow(10, Math.floor(Math.log10(rough)));
    const candidates = [1, 2, 5, 10].map((m) => m * pow);
    const step = candidates.find((c) => c >= rough) ?? candidates[candidates.length - 1];
    const out: Array<{ ms: number; label: string }> = [];
    for (let v = 0; v <= xMax; v += step) {
      out.push({ ms: v, label: formatDuration(Math.round(v)) });
    }
    return out;
  });

  function truncate(text: string, max = 60): string {
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }
</script>

<div class="rounded-xl border border-gray-300 p-5 dark:border-gray-600">
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-base font-semibold">Time per Question</h3>
    {#if data.length > 0}
      <span class="text-[11px] text-gray-500">Box = p25–p75 · whisker = p5–p95 · line = median</span>
    {/if}
  </div>

  {#if data.length === 0}
    <p class="py-8 text-center text-sm text-gray-500">
      No per-question timing data yet — timings are collected for new responses once this feature is live.
    </p>
  {:else}
    <div class="space-y-2">
      {#each data as row, i (row.questionId)}
        <div class="flex items-center gap-3 text-xs">
          <span class="w-6 shrink-0 text-right font-mono text-gray-500 tabular-nums">Q{i + 1}</span>
          <div class="min-w-0 flex-1">
            <div class="mb-0.5 flex items-baseline justify-between gap-2">
              <span class="truncate text-gray-300">{truncate(row.questionText)}</span>
              <span class="shrink-0 text-gray-500 tabular-nums">
                n={row.sampleSize} · median {formatDuration(row.medianMs)}
              </span>
            </div>
            <!-- Track + box plot. All sub-elements are percentage-positioned -->
            <div class="relative h-5 rounded bg-gray-800/30">
              {#if row.sampleSize > 0}
                {@const p5 = xPct(row.p5Ms)}
                {@const p25 = xPct(row.p25Ms)}
                {@const p50 = xPct(row.medianMs)}
                {@const p75 = xPct(row.p75Ms)}
                {@const p95 = xPct(row.p95Ms)}
                <!-- Whisker line (p5 → p95) -->
                <div
                  class="absolute top-1/2 h-px -translate-y-1/2 bg-purple-400/50"
                  style="left: {p5}%; width: {Math.max(0, p95 - p5)}%"
                ></div>
                <!-- Whisker caps at p5 and p95 -->
                <div class="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-purple-400/50" style="left: {p5}%"></div>
                <div class="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-purple-400/50" style="left: {p95}%"></div>
                <!-- IQR box (p25 → p75) -->
                <div
                  class="absolute top-1/2 h-3 -translate-y-1/2 rounded bg-purple-500/60"
                  style="left: {p25}%; width: {Math.max(0.5, p75 - p25)}%"
                ></div>
                <!-- Median tick -->
                <div
                  class="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-white dark:bg-gray-100"
                  style="left: {p50}%"
                ></div>
              {/if}
            </div>
          </div>
          <!-- Right-hand value: fixed-width so rows line up -->
          <span class="hidden w-20 shrink-0 text-right text-gray-500 tabular-nums sm:inline">
            {formatDuration(row.p75Ms)}
          </span>
        </div>
      {/each}
    </div>

    <!-- X-axis ticks -->
    <div class="relative mt-2 ml-9 h-4 sm:mr-20">
      <div class="absolute top-0 right-0 left-0 h-px bg-gray-700"></div>
      {#each ticks as t (t.ms)}
        <div class="absolute top-0 -translate-x-1/2" style="left: {xPct(t.ms)}%">
          <div class="h-1 w-px bg-gray-700"></div>
          <span class="text-[10px] text-gray-500 tabular-nums">{t.label}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
