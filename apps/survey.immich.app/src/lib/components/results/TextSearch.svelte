<script lang="ts">
  import { Icon } from '@immich/ui';
  import { Input } from '@immich/ui';
  import { mdiMagnify } from '@mdi/js';
  import type { SearchResult, SurveyQuestion } from '$lib/types';
  import { searchAnswers } from '$lib/api/surveys';

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

  const textQuestions = $derived(questions.filter((q) => ['text', 'textarea', 'email'].includes(q.type)));
  const hasMore = $derived(currentOffset + pageSize < totalResults);

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

  function loadMore() {
    doSearch(currentOffset + pageSize);
  }

  $effect(() => {
    void query;
    void questionFilter;
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
      Showing {results.length} of {totalResults} result{totalResults === 1 ? '' : 's'}
    </p>
    <div class="space-y-2">
      {#each results as result (result.respondentId + result.questionId)}
        <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <p class="mb-1 text-xs font-medium text-gray-500">{result.questionText}</p>
          <p class="text-sm">{result.answer}</p>
          <p class="mt-1 font-mono text-[10px] text-gray-500">Respondent {result.respondentId.slice(0, 8)}</p>
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
