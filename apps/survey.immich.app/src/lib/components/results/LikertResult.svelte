<script lang="ts">
  import LowSampleNotice from './LowSampleNotice.svelte';
  import { computeLikert, LOW_SAMPLE_THRESHOLD, type AnswerData } from './analytics-utils';

  interface Props {
    answers: AnswerData[];
  }

  let { answers }: Props = $props();

  const stats = $derived(computeLikert(answers));
  const lowSample = $derived(stats.total > 0 && stats.total < LOW_SAMPLE_THRESHOLD);

  /**
   * Diverging stacked bar layout:
   *   Negative half                  | Positive half
   *   SD           D     | Neutral (centered on midline) | A            SA
   *
   * The bar uses 100% width, with 50% always centered on the neutral midpoint.
   * Negatives extend LEFT from center, positives extend RIGHT.
   */
  const sdPct = $derived(stats.percents['Strongly Disagree']);
  const dPct = $derived(stats.percents['Disagree']);
  const nPct = $derived(stats.percents['Neutral']);
  const aPct = $derived(stats.percents['Agree']);
  const saPct = $derived(stats.percents['Strongly Agree']);

  // Neutral straddles the midline — half on each side
  const nHalf = $derived(nPct / 2);

  // Total negative includes half of neutral; same for positive
  const totalNeg = $derived(sdPct + dPct + nHalf);
  const totalPos = $derived(saPct + aPct + nHalf);
  const maxSide = $derived(Math.max(totalNeg, totalPos, 1));

  // Scale so the widest side fills 50% of the bar
  const scale = $derived(50 / maxSide);

  // Widths (as % of total bar) for each segment
  const sdWidth = $derived(sdPct * scale);
  const dWidth = $derived(dPct * scale);
  const nNegWidth = $derived(nHalf * scale);
  const nPosWidth = $derived(nHalf * scale);
  const aWidth = $derived(aPct * scale);
  const saWidth = $derived(saPct * scale);

  // Left padding before the first negative segment (so everything lines up on the midline)
  const leftPad = $derived(50 - sdWidth - dWidth - nNegWidth);
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-end gap-x-8 gap-y-3">
    <div>
      <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">Agree</div>
      <div class="mt-0.5 text-2xl font-bold tabular-nums text-green-400">
        {stats.agreePct.toFixed(0)}%
      </div>
    </div>
    <div>
      <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">Neutral</div>
      <div class="mt-0.5 text-2xl font-bold tabular-nums text-gray-300">
        {stats.neutralPct.toFixed(0)}%
      </div>
    </div>
    <div>
      <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">Disagree</div>
      <div class="mt-0.5 text-2xl font-bold tabular-nums text-red-400">
        {stats.disagreePct.toFixed(0)}%
      </div>
    </div>
    <div>
      <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">Mean</div>
      <div class="mt-0.5 text-2xl font-bold tabular-nums text-gray-200">
        {stats.mean !== null ? stats.mean.toFixed(2) : '–'}
      </div>
      <div class="text-[11px] text-gray-500">1–5 scale</div>
    </div>
    <div class="ml-auto">
      <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">Responses</div>
      <div class="mt-0.5 text-2xl font-bold tabular-nums text-gray-200">{stats.total}</div>
    </div>
  </div>

  {#if lowSample}
    <LowSampleNotice count={stats.total} threshold={LOW_SAMPLE_THRESHOLD} metricName="distribution" />
  {/if}

  {#if stats.total > 0}
    <!-- Diverging stacked bar -->
    <div class="relative">
      <!-- Midline -->
      <div class="pointer-events-none absolute top-0 bottom-0 left-1/2 z-10 w-px bg-gray-500/50"></div>

      <div class="flex h-8 w-full overflow-hidden rounded-md bg-gray-200/30 dark:bg-gray-800/40">
        <!-- Left padding to align on midline -->
        <div style="width: {leftPad}%" class="shrink-0"></div>

        {#if sdWidth > 0}
          <div
            class="flex items-center justify-center bg-red-600/85 text-[10px] font-semibold text-white"
            style="width: {sdWidth}%"
            title="Strongly Disagree: {stats.counts['Strongly Disagree']} ({sdPct.toFixed(1)}%)"
          >
            {#if sdWidth >= 8}{sdPct.toFixed(0)}%{/if}
          </div>
        {/if}
        {#if dWidth > 0}
          <div
            class="flex items-center justify-center bg-red-400/85 text-[10px] font-semibold text-white"
            style="width: {dWidth}%"
            title="Disagree: {stats.counts['Disagree']} ({dPct.toFixed(1)}%)"
          >
            {#if dWidth >= 8}{dPct.toFixed(0)}%{/if}
          </div>
        {/if}
        {#if nNegWidth > 0}
          <div
            class="bg-gray-400/60"
            style="width: {nNegWidth}%"
            title="Neutral: {stats.counts['Neutral']} ({nPct.toFixed(1)}%)"
          ></div>
        {/if}
        {#if nPosWidth > 0}
          <div
            class="bg-gray-400/60"
            style="width: {nPosWidth}%"
          ></div>
        {/if}
        {#if aWidth > 0}
          <div
            class="flex items-center justify-center bg-green-400/85 text-[10px] font-semibold text-white"
            style="width: {aWidth}%"
            title="Agree: {stats.counts['Agree']} ({aPct.toFixed(1)}%)"
          >
            {#if aWidth >= 8}{aPct.toFixed(0)}%{/if}
          </div>
        {/if}
        {#if saWidth > 0}
          <div
            class="flex items-center justify-center bg-green-600/85 text-[10px] font-semibold text-white"
            style="width: {saWidth}%"
            title="Strongly Agree: {stats.counts['Strongly Agree']} ({saPct.toFixed(1)}%)"
          >
            {#if saWidth >= 8}{saPct.toFixed(0)}%{/if}
          </div>
        {/if}
      </div>

      <!-- Legend -->
      <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
        <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-sm bg-red-600/85"></span>Strongly Disagree</span>
        <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-sm bg-red-400/85"></span>Disagree</span>
        <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-sm bg-gray-400/60"></span>Neutral</span>
        <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-sm bg-green-400/85"></span>Agree</span>
        <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-sm bg-green-600/85"></span>Strongly Agree</span>
      </div>
    </div>
  {:else}
    <p class="text-sm text-gray-500">No responses yet.</p>
  {/if}
</div>
