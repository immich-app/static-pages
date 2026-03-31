<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { Icon } from '@immich/ui';
  import { mdiArrowLeft, mdiAccountGroup, mdiCheckCircle, mdiDownload } from '@mdi/js';
  import type { Survey, SurveyQuestion, SurveySection } from '$lib/types';
  import { getSurvey, getSurveyResults, exportResults } from '$lib/api/surveys';
  import QuestionResult from '$lib/components/results/QuestionResult.svelte';

  const surveyId = $derived(page.params.id!);

  let survey = $state<Survey | null>(null);
  let questions = $state<SurveyQuestion[]>([]);
  let sections = $state<SurveySection[]>([]);
  let respondentCounts = $state({ total: 0, completed: 0 });
  let results = $state<
    Array<{ questionId: string; answers: Array<{ value: string; otherText: string | null; count: number }> }>
  >([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      const [surveyData, resultsData] = await Promise.all([getSurvey(surveyId), getSurveyResults(surveyId)]);
      survey = surveyData.survey;
      questions = surveyData.questions;
      sections = surveyData.sections;
      respondentCounts = resultsData.respondentCounts;
      results = resultsData.results;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load results';
    }
    loading = false;
  });

  function getQuestionResult(questionId: string) {
    return results.find((r) => r.questionId === questionId);
  }

  const sortedQuestions = $derived.by(() => {
    const sectionOrder = new Map(sections.map((s) => [s.id, s.sortOrder]));
    return [...questions].sort((a, b) => {
      const sectionDiff = (sectionOrder.get(a.section_id) ?? 0) - (sectionOrder.get(b.section_id) ?? 0);
      if (sectionDiff !== 0) return sectionDiff;
      return a.sortOrder - b.sortOrder;
    });
  });

  const completionRate = $derived(
    respondentCounts.total > 0 ? Math.round((respondentCounts.completed / respondentCounts.total) * 100) : 0,
  );

  let exporting = $state(false);

  async function handleExport(format: 'csv' | 'json') {
    exporting = true;
    try {
      await exportResults(surveyId, format);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Export failed';
    }
    exporting = false;
  }

  function computeNpsScore(answers: Array<{ value: string; count: number }>) {
    let total = 0;
    let promoters = 0;
    let detractors = 0;
    for (const a of answers) {
      const score = Number(a.value);
      if (Number.isNaN(score)) continue;
      total += a.count;
      if (score >= 9) promoters += a.count;
      else if (score <= 6) detractors += a.count;
    }
    if (total === 0) return null;
    return Math.round(((promoters - detractors) / total) * 100);
  }
</script>

<div class="mx-auto max-w-3xl px-6 py-10">
  {#if loading}
    <div class="flex flex-col items-center justify-center py-24">
      <div class="border-t-immich-primary h-8 w-8 animate-spin rounded-full border-2 border-gray-600"></div>
      <p class="mt-4 text-sm text-gray-500">Loading results...</p>
    </div>
  {:else if error}
    <div class="flex flex-col items-center py-24 text-center">
      <p class="text-lg text-red-400">{error}</p>
      <a href="/" class="mt-4 text-sm text-gray-400 hover:underline">Back to dashboard</a>
    </div>
  {:else if survey}
    <div class="animate-in mb-8">
      <a
        href="/"
        class="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-200"
      >
        <Icon icon={mdiArrowLeft} size="14" />
        Back to dashboard
      </a>
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">{survey.title}</h1>
          <p class="mt-1 text-sm text-gray-500">Survey results and analytics</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-200 disabled:opacity-50 dark:border-gray-700"
            disabled={exporting}
            onclick={() => handleExport('csv')}
          >
            <Icon icon={mdiDownload} size="15" />
            Export CSV
          </button>
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-200 disabled:opacity-50 dark:border-gray-700"
            disabled={exporting}
            onclick={() => handleExport('json')}
          >
            <Icon icon={mdiDownload} size="15" />
            Export JSON
          </button>
        </div>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="animate-in animate-in-delay-1 mb-8 grid grid-cols-3 gap-3">
      <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700/80">
        <div class="flex items-center gap-2 text-gray-500">
          <Icon icon={mdiAccountGroup} size="16" />
          <span class="text-xs font-medium tracking-wider uppercase">Total</span>
        </div>
        <p class="mt-2 text-2xl font-bold">{respondentCounts.total}</p>
      </div>
      <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700/80">
        <div class="flex items-center gap-2 text-gray-500">
          <Icon icon={mdiCheckCircle} size="16" />
          <span class="text-xs font-medium tracking-wider uppercase">Completed</span>
        </div>
        <p class="mt-2 text-2xl font-bold">{respondentCounts.completed}</p>
      </div>
      <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700/80">
        <div class="flex items-center gap-2 text-gray-500">
          <span class="text-xs font-medium tracking-wider uppercase">Completion</span>
        </div>
        <p class="mt-2 text-2xl font-bold">{completionRate}%</p>
      </div>
    </div>

    <div class="animate-in animate-in-delay-2 space-y-4">
      {#each sortedQuestions as question, i (question.id)}
        {@const result = getQuestionResult(question.id)}
        <div style="animation-delay: {180 + i * 40}ms" class="animate-in">
          <QuestionResult {question} answers={result?.answers ?? []} totalResponses={respondentCounts.completed} />
          {#if question.type === 'nps' && result?.answers}
            {@const npsScore = computeNpsScore(result.answers)}
            {#if npsScore !== null}
              <div
                class="mt-2 flex items-center gap-3 rounded-lg border px-4 py-3 {npsScore >= 0
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-red-500/20 bg-red-500/5'}"
              >
                <span class="text-sm font-medium text-gray-400">NPS Score</span>
                <span class="text-2xl font-bold {npsScore >= 0 ? 'text-green-400' : 'text-red-400'}">{npsScore}</span>
                <span class="text-xs text-gray-500"
                  >({npsScore >= 50
                    ? 'Excellent'
                    : npsScore >= 0
                      ? 'Good'
                      : npsScore >= -50
                        ? 'Needs improvement'
                        : 'Critical'})</span
                >
              </div>
            {/if}
          {/if}
        </div>
      {/each}

      {#if sortedQuestions.length === 0}
        <div class="rounded-xl border border-dashed border-gray-600 px-8 py-16 text-center">
          <p class="text-gray-400">No questions in this survey yet</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
