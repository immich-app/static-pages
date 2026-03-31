<script lang="ts">
  interface AnswerData {
    value: string;
    count: number;
  }

  interface Props {
    answers: AnswerData[];
  }

  let { answers }: Props = $props();

  const stats = $derived.by(() => {
    let total = 0, promoters = 0, passives = 0, detractors = 0;
    for (const a of answers) {
      const score = Number(a.value);
      if (Number.isNaN(score)) continue;
      total += a.count;
      if (score >= 9) promoters += a.count;
      else if (score >= 7) passives += a.count;
      else detractors += a.count;
    }
    const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null;
    const pPct = total > 0 ? (promoters / total) * 100 : 0;
    const paPct = total > 0 ? (passives / total) * 100 : 0;
    const dPct = total > 0 ? (detractors / total) * 100 : 0;
    return { total, promoters, passives, detractors, npsScore, pPct, paPct, dPct };
  });

  const label = $derived(
    stats.npsScore === null ? '' :
    stats.npsScore >= 50 ? 'Excellent' :
    stats.npsScore >= 0 ? 'Good' :
    stats.npsScore >= -50 ? 'Needs improvement' : 'Critical'
  );
</script>

{#if stats.npsScore !== null}
  <div class="mt-2 rounded-lg border px-4 py-3 {stats.npsScore >= 0 ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}">
    <div class="mb-3 flex items-center gap-3">
      <span class="text-sm font-medium text-gray-400">NPS Score</span>
      <span class="text-2xl font-bold {stats.npsScore >= 0 ? 'text-green-400' : 'text-red-400'}">{stats.npsScore}</span>
      <span class="text-xs text-gray-500">({label})</span>
    </div>

    <!-- Segmented bar -->
    <div class="flex h-3 overflow-hidden rounded-full">
      {#if stats.dPct > 0}
        <div class="bg-red-500" style="width: {stats.dPct}%" title="Detractors: {stats.detractors}"></div>
      {/if}
      {#if stats.paPct > 0}
        <div class="bg-amber-500" style="width: {stats.paPct}%" title="Passives: {stats.passives}"></div>
      {/if}
      {#if stats.pPct > 0}
        <div class="bg-green-500" style="width: {stats.pPct}%" title="Promoters: {stats.promoters}"></div>
      {/if}
    </div>

    <div class="mt-2 flex justify-between text-[11px] text-gray-500">
      <span>Detractors ({stats.detractors})</span>
      <span>Passives ({stats.passives})</span>
      <span>Promoters ({stats.promoters})</span>
    </div>
  </div>
{/if}
