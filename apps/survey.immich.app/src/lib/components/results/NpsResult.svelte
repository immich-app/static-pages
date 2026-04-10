<script lang="ts">
  import LowSampleNotice from './LowSampleNotice.svelte';
  import {
    computeNps,
    npsDistribution,
    npsLabel,
    NPS_MIN_SAMPLE,
    type AnswerData,
  } from './analytics-utils';

  interface Props {
    answers: AnswerData[];
  }

  let { answers }: Props = $props();

  const stats = $derived(computeNps(answers));
  const label = $derived(npsLabel(stats.npsScore));
  const dist = $derived(npsDistribution(answers));
  const lowSample = $derived(stats.total > 0 && stats.total < NPS_MIN_SAMPLE);

  const maxBucket = $derived(Math.max(1, ...dist.map((d) => d.count)));

  function scoreColour(score: number | null): string {
    if (score === null) return 'text-gray-400';
    if (score >= 50) return 'text-green-400';
    if (score >= 0) return 'text-emerald-400';
    if (score >= -50) return 'text-amber-400';
    return 'text-red-400';
  }

  function bucketColour(score: number): string {
    if (score <= 6) return 'bg-red-500/70';
    if (score <= 8) return 'bg-amber-500/70';
    return 'bg-green-500/70';
  }
</script>

<div class="space-y-4">
  <!-- Big NPS number + label -->
  <div class="flex flex-wrap items-end gap-x-8 gap-y-3">
    <div>
      <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">NPS Score</div>
      <div class="mt-0.5 flex items-baseline gap-2">
        <span class="text-4xl font-bold tabular-nums {scoreColour(stats.npsScore)}">
          {stats.npsScore ?? '–'}
        </span>
        {#if label}
          <span class="text-xs text-gray-500">{label}</span>
        {/if}
      </div>
    </div>

    <div>
      <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">Promoters</div>
      <div class="mt-0.5 text-xl font-bold tabular-nums text-green-400">
        {stats.pPct.toFixed(0)}%
      </div>
      <div class="text-[11px] text-gray-500">{stats.promoters} · score 9–10</div>
    </div>

    <div>
      <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">Passives</div>
      <div class="mt-0.5 text-xl font-bold tabular-nums text-amber-400">
        {stats.paPct.toFixed(0)}%
      </div>
      <div class="text-[11px] text-gray-500">{stats.passives} · score 7–8</div>
    </div>

    <div>
      <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">Detractors</div>
      <div class="mt-0.5 text-xl font-bold tabular-nums text-red-400">
        {stats.dPct.toFixed(0)}%
      </div>
      <div class="text-[11px] text-gray-500">{stats.detractors} · score 0–6</div>
    </div>

    <div class="ml-auto">
      <div class="text-[10px] font-medium tracking-wider text-gray-500 uppercase">Responses</div>
      <div class="mt-0.5 text-xl font-bold tabular-nums text-gray-200">{stats.total}</div>
    </div>
  </div>

  {#if lowSample}
    <LowSampleNotice count={stats.total} threshold={NPS_MIN_SAMPLE} metricName="NPS" />
  {/if}

  <!-- 3-segment stacked bar (detractor / passive / promoter) -->
  {#if stats.total > 0}
    <div>
      <div class="flex h-4 w-full overflow-hidden rounded-full bg-gray-800">
        {#if stats.dPct > 0}
          <div
            class="flex items-center justify-center bg-red-500/80 text-[10px] font-semibold text-white"
            style="width: {stats.dPct}%"
            title="Detractors ({stats.dPct.toFixed(1)}%)"
          >
            {#if stats.dPct >= 8}{stats.dPct.toFixed(0)}%{/if}
          </div>
        {/if}
        {#if stats.paPct > 0}
          <div
            class="flex items-center justify-center bg-amber-500/80 text-[10px] font-semibold text-white"
            style="width: {stats.paPct}%"
            title="Passives ({stats.paPct.toFixed(1)}%)"
          >
            {#if stats.paPct >= 8}{stats.paPct.toFixed(0)}%{/if}
          </div>
        {/if}
        {#if stats.pPct > 0}
          <div
            class="flex items-center justify-center bg-green-500/80 text-[10px] font-semibold text-white"
            style="width: {stats.pPct}%"
            title="Promoters ({stats.pPct.toFixed(1)}%)"
          >
            {#if stats.pPct >= 8}{stats.pPct.toFixed(0)}%{/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- Per-score distribution -->
    <div>
      <div class="mb-1 text-[10px] font-medium tracking-wider text-gray-500 uppercase">
        Score distribution
      </div>
      <div class="flex h-20 items-end gap-1">
        {#each dist as bucket (bucket.score)}
          <div class="flex flex-1 flex-col items-center gap-1" title="{bucket.count} respondents rated {bucket.score}">
            <div class="flex-1 w-full flex items-end">
              <div
                class="w-full rounded-sm {bucketColour(bucket.score)} transition-all"
                style="height: {(bucket.count / maxBucket) * 100}%"
              ></div>
            </div>
            <span class="text-[10px] tabular-nums text-gray-500">{bucket.score}</span>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <p class="text-sm text-gray-500">No responses yet.</p>
  {/if}
</div>
