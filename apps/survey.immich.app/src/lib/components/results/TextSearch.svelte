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
  let loading = $state(false);
  let searched = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const textQuestions = $derived(questions.filter((q) => ['text', 'textarea', 'email'].includes(q.type)));

  function handleSearch() {
    clearTimeout(debounceTimer);
    if (query.trim().length < 2) {
      results = [];
      searched = false;
      return;
    }
    debounceTimer = setTimeout(async () => {
      loading = true;
      searched = true;
      try {
        results = await searchAnswers(surveyId, query.trim(), questionFilter || undefined);
      } catch {
        results = [];
      }
      loading = false;
    }, 300);
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

  {#if loading}
    <p class="py-8 text-center text-sm text-gray-500">Searching...</p>
  {:else if searched && results.length === 0}
    <p class="py-8 text-center text-sm text-gray-500">No results found</p>
  {:else if results.length > 0}
    <div class="space-y-2">
      {#each results as result (result.respondentId + result.questionId)}
        <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <p class="mb-1 text-xs font-medium text-gray-500">{result.questionText}</p>
          <p class="text-sm">{result.answer}</p>
          <p class="mt-1 font-mono text-[10px] text-gray-600">Respondent {result.respondentId.slice(0, 8)}</p>
        </div>
      {/each}
    </div>
  {:else if !searched}
    <div class="flex flex-col items-center py-12 text-center">
      <Icon icon={mdiMagnify} size="32" class="mb-2 text-gray-600" />
      <p class="text-sm text-gray-500">Search through open-ended responses</p>
      <p class="text-xs text-gray-600">Type at least 2 characters to search</p>
    </div>
  {/if}
</div>
