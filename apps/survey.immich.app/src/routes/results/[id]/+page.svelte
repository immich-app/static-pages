<script lang="ts">
  import { page } from '$app/state';
  import { onMount, onDestroy } from 'svelte';
  import { Icon } from '@immich/ui';
  import { mdiArrowLeft, mdiAccountGroup, mdiCheckCircle, mdiDownload } from '@mdi/js';
  import type {
    Survey,
    SurveyQuestion,
    SurveySection,
    TimelineDataPoint,
    DropoffDataPoint,
    LiveCounts,
  } from '$lib/types';
  import {
    getSurvey,
    getLiveResults,
    exportResults,
    getSurveyTimeline,
    getSurveyDropoff,
    sendHeartbeat,
  } from '$lib/api/surveys';
  import QuestionResult from '$lib/components/results/QuestionResult.svelte';
  import ResultsTabs from '$lib/components/results/ResultsTabs.svelte';
  import LiveIndicator from '$lib/components/results/LiveIndicator.svelte';
  import TimelineChart from '$lib/components/results/TimelineChart.svelte';
  import DropoffChart from '$lib/components/results/DropoffChart.svelte';
  import FilterBar from '$lib/components/results/FilterBar.svelte';
  import ResponseViewer from '$lib/components/results/ResponseViewer.svelte';
  import TextSearch from '$lib/components/results/TextSearch.svelte';
  import PdfExportButton from '$lib/components/results/PdfExportButton.svelte';
  import SharePanel from '$lib/components/sharing/SharePanel.svelte';

  const surveyId = $derived(page.params.id!);

  let survey = $state<Survey | null>(null);
  const surveyUrl = $derived(survey?.slug ? `https://survey.immich.app/s/${survey.slug}` : '');
  let questions = $state<SurveyQuestion[]>([]);
  let sections = $state<SurveySection[]>([]);
  let respondentCounts = $state({ total: 0, completed: 0 });
  let results = $state<
    Array<{ questionId: string; answers: Array<{ value: string; otherText: string | null; count: number }> }>
  >([]);
  let liveCounts = $state<LiveCounts>({ activeViewers: 0, activeRespondents: 0 });
  let timelineData = $state<TimelineDataPoint[]>([]);
  let dropoffData = $state<DropoffDataPoint[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let activeTab = $state<'overview' | 'responses' | 'search'>('overview');
  let granularity = $state<'day' | 'hour'>('day');
  let filterQuestionId = $state('');
  let filterValue = $state('');

  let pollInterval: ReturnType<typeof setInterval> | undefined;
  let heartbeatInterval: ReturnType<typeof setInterval> | undefined;
  const viewerId = crypto.randomUUID();

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

  async function refreshResults() {
    try {
      const data = await getLiveResults(surveyId);
      respondentCounts = data.respondentCounts;
      results = data.results;
      liveCounts = data.liveCounts;
    } catch {
      // silently fail on poll
    }
  }

  async function refreshTimeline() {
    try {
      timelineData = await getSurveyTimeline(surveyId, granularity);
    } catch {
      // ignore
    }
  }

  function handleGranularityChange(g: 'day' | 'hour') {
    granularity = g;
    refreshTimeline();
  }

  function handleFilterChange(qId: string, val: string) {
    filterQuestionId = qId;
    filterValue = val;
  }

  onMount(async () => {
    try {
      const [surveyData, resultsData, timeline, dropoff] = await Promise.all([
        getSurvey(surveyId),
        getLiveResults(surveyId),
        getSurveyTimeline(surveyId, granularity),
        getSurveyDropoff(surveyId),
      ]);
      survey = surveyData.survey;
      questions = surveyData.questions;
      sections = surveyData.sections;
      respondentCounts = resultsData.respondentCounts;
      results = resultsData.results;
      liveCounts = resultsData.liveCounts;
      timelineData = timeline;
      dropoffData = dropoff;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load results';
    }
    loading = false;

    // Start polling
    pollInterval = setInterval(() => {
      refreshResults();
    }, 15_000);

    // Start viewer heartbeat
    if (survey?.slug) {
      const slug = survey.slug;
      sendHeartbeat(slug, viewerId, 'viewer');
      heartbeatInterval = setInterval(() => {
        sendHeartbeat(slug, viewerId, 'viewer');
      }, 15_000);
    }
  });

  onDestroy(() => {
    clearInterval(pollInterval);
    clearInterval(heartbeatInterval);
  });
</script>

<div class="mx-auto max-w-4xl px-6 py-10">
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
        <div class="flex items-center gap-3">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">{survey.title}</h1>
            <p class="mt-1 text-sm text-gray-500">Survey results and analytics</p>
          </div>
          <LiveIndicator counts={liveCounts} />
        </div>
        <div class="flex items-center gap-2">
          {#if surveyUrl}
            <SharePanel url={surveyUrl} title={survey.title} description={survey.description ?? ''} />
          {/if}
          <PdfExportButton targetSelector="#results-content" filename="{survey.slug ?? survey.id}-results.pdf" />
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-200 disabled:opacity-50 dark:border-gray-700"
            disabled={exporting}
            onclick={() => handleExport('csv')}
          >
            <Icon icon={mdiDownload} size="15" />
            CSV
          </button>
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-200 disabled:opacity-50 dark:border-gray-700"
            disabled={exporting}
            onclick={() => handleExport('json')}
          >
            <Icon icon={mdiDownload} size="15" />
            JSON
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="animate-in animate-in-delay-1 mb-6">
      <ResultsTabs active={activeTab} onChange={(t) => (activeTab = t)} />
    </div>

    <div id="results-content">
      {#if activeTab === 'overview'}
        <!-- Stats cards -->
        <div class="animate-in animate-in-delay-1 mb-6 grid grid-cols-3 gap-3">
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

        <!-- Timeline -->
        <div class="animate-in animate-in-delay-2 mb-6">
          <TimelineChart data={timelineData} {granularity} onGranularityChange={handleGranularityChange} />
        </div>

        <!-- Drop-off -->
        {#if dropoffData.length > 0}
          <div class="animate-in animate-in-delay-2 mb-6">
            <DropoffChart data={dropoffData} />
          </div>
        {/if}

        <!-- Filter bar -->
        <div class="mb-4">
          <FilterBar {questions} {filterQuestionId} {filterValue} onFilterChange={handleFilterChange} />
        </div>

        <!-- Per-question results -->
        <div class="space-y-4">
          {#each sortedQuestions as question, i (question.id)}
            {@const result = getQuestionResult(question.id)}
            <div style="animation-delay: {180 + i * 40}ms" class="animate-in">
              <QuestionResult {question} answers={result?.answers ?? []} totalResponses={respondentCounts.completed} />
            </div>
          {/each}

          {#if sortedQuestions.length === 0}
            <div class="rounded-xl border border-dashed border-gray-600 px-8 py-16 text-center">
              <p class="text-gray-400">No questions in this survey yet</p>
            </div>
          {/if}
        </div>
      {:else if activeTab === 'responses'}
        <ResponseViewer {surveyId} />
      {:else if activeTab === 'search'}
        <TextSearch {surveyId} {questions} />
      {/if}
    </div>
  {/if}
</div>
