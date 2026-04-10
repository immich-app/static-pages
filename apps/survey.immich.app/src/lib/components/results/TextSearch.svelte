<script lang="ts">
  import { Icon } from '@immich/ui';
  import { Input } from '@immich/ui';
  import { mdiMagnify, mdiChevronDown, mdiChevronUp } from '@mdi/js';
  import type { RespondentDetail, SearchResult, SurveyQuestion } from '$lib/types';
  import { getRespondent, searchAnswers } from '$lib/api/surveys';
  import ResponseDetail from './ResponseDetail.svelte';

  interface Props {
    surveyId: string;
    questions: SurveyQuestion[];
  }

  let { surveyId, questions }: Props = $props();

  let query = $state('');
  let questionFilter = $state('');
  let results = $state<SearchResult[]>([]);
  let totalResults = $state(0);
  let currentOffset = $state(0);
  const pageSize = 50;
  let loading = $state(false);
  let searched = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  // Respondent detail expansion
  let selectedKey = $state<string | null>(null);
  let selectedDetail = $state<RespondentDetail | null>(null);
  let selectedMatchQuestionId = $state<string | null>(null);
  let loadingDetail = $state(false);
  let detailError = $state<string | null>(null);

  const textQuestions = $derived(questions.filter((q) => ['text', 'textarea', 'email'].includes(q.type)));
  const hasMore = $derived(currentOffset + pageSize < totalResults);

  function resultKey(r: SearchResult): string {
    return `${r.respondentId}:${r.questionId}`;
  }

  async function doSearch(offset = 0) {
    loading = true;
    searched = true;
    try {
      const data = await searchAnswers(surveyId, query.trim(), questionFilter || undefined, {
        offset,
        limit: pageSize,
      });
      results = offset === 0 ? data.results : [...results, ...data.results];
      totalResults = data.total;
      currentOffset = offset;
    } catch {
      if (offset === 0) results = [];
    }
    loading = false;
  }

  function handleSearch() {
    clearTimeout(debounceTimer);
    if (query.trim().length < 2) {
      results = [];
      totalResults = 0;
      currentOffset = 0;
      searched = false;
      return;
    }
    debounceTimer = setTimeout(() => doSearch(0), 300);
  }

  async function toggleDetail(result: SearchResult) {
    const key = resultKey(result);
    if (selectedKey === key) {
      selectedKey = null;
      selectedDetail = null;
      selectedMatchQuestionId = null;
      detailError = null;
      return;
    }
    selectedKey = key;
    selectedMatchQuestionId = result.questionId;
    detailError = null;
    // If we already have this respondent loaded, just update the highlight
    if (selectedDetail?.id === result.respondentId) return;
    selectedDetail = null;
    loadingDetail = true;
    try {
      selectedDetail = await getRespondent(surveyId, result.respondentId);
    } catch {
      detailError = 'Could not load this respondent.';
    }
    loadingDetail = false;
  }

  function loadMore() {
    doSearch(currentOffset + pageSize);
  }

  // Reset expanded detail whenever the search changes
  $effect(() => {
    void query;
    void questionFilter;
    selectedKey = null;
    selectedDetail = null;
    selectedMatchQuestionId = null;
    detailError = null;
    handleSearch();
  });
</script>

<div class="space-y-4">
  <div class="flex gap-3">
    <div class="flex-1">
      <Input bind:value={query} placeholder="Search answers..." />
    </div>
    {#if textQuestions.length > 0}
      <select
        class="rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600"
        bind:value={questionFilter}
      >
        <option value="">All questions</option>
        {#each textQuestions as q (q.id)}
          <option value={q.id}>{q.text.length > 40 ? q.text.slice(0, 40) + '...' : q.text}</option>
        {/each}
      </select>
    {/if}
  </div>

  {#if loading && results.length === 0}
    <p class="py-8 text-center text-sm text-gray-500">Searching...</p>
  {:else if searched && results.length === 0}
    <p class="py-8 text-center text-sm text-gray-500">No results found</p>
  {:else if results.length > 0}
    <p class="text-xs text-gray-500">
      Showing {results.length} of {totalResults} result{totalResults === 1 ? '' : 's'} · click a row to view the full response
    </p>
    <div class="space-y-2">
      {#each results as result (resultKey(result))}
        {@const key = resultKey(result)}
        {@const expanded = selectedKey === key}
        <div
          class="rounded-lg border border-gray-200 transition-colors dark:border-gray-700 {expanded
            ? 'bg-gray-50 dark:bg-gray-800/40'
            : ''}"
        >
          <button
            type="button"
            class="flex w-full items-start gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40"
            onclick={() => toggleDetail(result)}
            aria-expanded={expanded}
          >
            <div class="min-w-0 flex-1">
              <p class="mb-1 text-xs font-medium text-gray-500">{result.questionText}</p>
              <p class="text-sm whitespace-pre-wrap">{result.answer}</p>
              <p class="mt-1 font-mono text-[10px] text-gray-500">Respondent {result.respondentId.slice(0, 8)}</p>
            </div>
            <Icon icon={expanded ? mdiChevronUp : mdiChevronDown} size="16" class="mt-0.5 shrink-0 text-gray-500" />
          </button>
          {#if expanded}
            <div class="border-t border-gray-200 px-3 pt-3 pb-3 dark:border-gray-700">
              {#if loadingDetail}
                <p class="py-4 text-center text-xs text-gray-500">Loading full response…</p>
              {:else if detailError}
                <p class="py-4 text-center text-xs text-red-400">{detailError}</p>
              {:else if selectedDetail}
                <ResponseDetail detail={selectedDetail} highlightQuestionId={selectedMatchQuestionId} />
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
    {#if hasMore}
      <div class="pt-2 text-center">
        <button
          class="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          onclick={loadMore}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load more'}
        </button>
      </div>
    {/if}
  {:else if !searched}
    <div class="flex flex-col items-center py-12 text-center">
      <Icon icon={mdiMagnify} size="32" class="mb-2 text-gray-500" />
      <p class="text-sm text-gray-500">Search through open-ended responses</p>
      <p class="text-xs text-gray-500">Type at least 2 characters to search</p>
    </div>
  {/if}
</div>
