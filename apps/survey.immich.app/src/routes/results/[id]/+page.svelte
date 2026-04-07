<script lang="ts">
  import { page } from '$app/state';
  import { Icon } from '@immich/ui';
  import { mdiArrowLeft, mdiAccountGroup, mdiCheckCircle, mdiDownload } from '@mdi/js';
  import { createResultsLoader } from '$lib/engines/results-loader.svelte';
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
  const loader = createResultsLoader(surveyId);
</script>

<div class="mx-auto max-w-4xl px-6 py-10">
  {#if loader.loading}
    <div class="flex flex-col items-center justify-center py-24">
      <div class="border-t-immich-primary h-8 w-8 animate-spin rounded-full border-2 border-gray-600"></div>
      <p class="mt-4 text-sm text-gray-500">Loading results...</p>
    </div>
  {:else if loader.error}
    <div class="flex flex-col items-center py-24 text-center">
      <p class="text-lg text-red-400">{loader.error}</p>
      <a href="/" class="mt-4 text-sm text-gray-400 hover:underline">Back to dashboard</a>
    </div>
  {:else if loader.survey}
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
            <h1 class="text-3xl font-bold tracking-tight">{loader.survey.title}</h1>
            <p class="mt-1 text-sm text-gray-500">Survey results and analytics</p>
          </div>
          <LiveIndicator counts={loader.liveCounts} />
        </div>
        <div class="flex items-center gap-2">
          {#if loader.surveyUrl}
            <SharePanel
              url={loader.surveyUrl}
              title={loader.survey.title}
              description={loader.survey.description ?? ''}
            />
          {/if}
          <PdfExportButton
            targetSelector="#results-content"
            filename="{loader.survey.slug ?? loader.survey.id}-results.pdf"
          />
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-200 disabled:opacity-50 dark:border-gray-700"
            disabled={loader.exporting}
            onclick={() => loader.handleExport('csv')}
          >
            <Icon icon={mdiDownload} size="15" />
            CSV
          </button>
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-200 disabled:opacity-50 dark:border-gray-700"
            disabled={loader.exporting}
            onclick={() => loader.handleExport('json')}
          >
            <Icon icon={mdiDownload} size="15" />
            JSON
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="animate-in animate-in-delay-1 mb-6">
      <ResultsTabs active={loader.activeTab} onChange={(t) => (loader.activeTab = t)} />
    </div>

    <div id="results-content">
      {#if loader.activeTab === 'overview'}
        <!-- Stats cards -->
        <div class="animate-in animate-in-delay-1 mb-6 grid grid-cols-3 gap-3">
          <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700/80">
            <div class="flex items-center gap-2 text-gray-500">
              <Icon icon={mdiAccountGroup} size="16" />
              <span class="text-xs font-medium tracking-wider uppercase">Total</span>
            </div>
            <p class="mt-2 text-2xl font-bold">{loader.respondentCounts.total}</p>
          </div>
          <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700/80">
            <div class="flex items-center gap-2 text-gray-500">
              <Icon icon={mdiCheckCircle} size="16" />
              <span class="text-xs font-medium tracking-wider uppercase">Completed</span>
            </div>
            <p class="mt-2 text-2xl font-bold">{loader.respondentCounts.completed}</p>
          </div>
          <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700/80">
            <div class="flex items-center gap-2 text-gray-500">
              <span class="text-xs font-medium tracking-wider uppercase">Completion</span>
            </div>
            <p class="mt-2 text-2xl font-bold">{loader.completionRate}%</p>
          </div>
        </div>

        <!-- Timeline -->
        <div class="animate-in animate-in-delay-2 mb-6">
          <TimelineChart
            data={loader.timelineData}
            granularity={loader.granularity}
            onGranularityChange={loader.handleGranularityChange}
          />
        </div>

        <!-- Drop-off -->
        {#if loader.dropoffData.length > 0}
          <div class="animate-in animate-in-delay-2 mb-6">
            <DropoffChart data={loader.dropoffData} />
          </div>
        {/if}

        <!-- Filter bar -->
        <div class="mb-4">
          <FilterBar
            questions={loader.questions}
            filterQuestionId={loader.filterQuestionId}
            filterValue={loader.filterValue}
            onFilterChange={loader.handleFilterChange}
          />
        </div>

        <!-- Per-question results -->
        <div class="space-y-4">
          {#each loader.sortedQuestions as question, i (question.id)}
            {@const result = loader.getQuestionResult(question.id)}
            <div style="animation-delay: {180 + i * 40}ms" class="animate-in">
              <QuestionResult
                {question}
                answers={result?.answers ?? []}
                totalResponses={loader.respondentCounts.completed}
              />
            </div>
          {/each}

          {#if loader.sortedQuestions.length === 0}
            <div class="rounded-xl border border-dashed border-gray-600 px-8 py-16 text-center">
              <p class="text-gray-400">No questions in this survey yet</p>
            </div>
          {/if}
        </div>
      {:else if loader.activeTab === 'responses'}
        <ResponseViewer {surveyId} />
      {:else if loader.activeTab === 'search'}
        <TextSearch {surveyId} questions={loader.questions} />
      {/if}
    </div>
  {/if}
</div>
