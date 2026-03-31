<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiClose } from '@mdi/js';
  import type { SurveyQuestion } from '$lib/types';

  interface Props {
    questions: SurveyQuestion[];
    filterQuestionId: string;
    filterValue: string;
    onFilterChange: (questionId: string, value: string) => void;
  }

  let { questions, filterQuestionId, filterValue, onFilterChange }: Props = $props();

  const filterableQuestions = $derived(questions.filter((q) => ['radio', 'checkbox', 'dropdown', 'nps', 'rating', 'likert'].includes(q.type)));

  const selectedQuestion = $derived(filterableQuestions.find((q) => q.id === filterQuestionId));

  const availableValues = $derived.by(() => {
    if (!selectedQuestion) return [];
    if (selectedQuestion.type === 'nps') return Array.from({ length: 11 }, (_, i) => String(i));
    if (selectedQuestion.type === 'rating') {
      const max = (selectedQuestion.config?.scaleMax as number) ?? 5;
      return Array.from({ length: max }, (_, i) => String(i + 1));
    }
    if (selectedQuestion.type === 'likert') return ['1', '2', '3', '4', '5'];
    return (selectedQuestion.options ?? []).map((o) => o.value);
  });

  const isFiltered = $derived(!!filterQuestionId && !!filterValue);
</script>

<div class="flex flex-wrap items-center gap-2">
  <span class="text-xs font-medium text-gray-500">Filter by:</span>
  <select
    class="rounded-md border border-gray-300 bg-transparent px-2 py-1.5 text-xs dark:border-gray-600"
    value={filterQuestionId}
    onchange={(e) => onFilterChange((e.target as HTMLSelectElement).value, '')}
  >
    <option value="">Select question...</option>
    {#each filterableQuestions as q (q.id)}
      <option value={q.id}>{q.text.length > 35 ? q.text.slice(0, 35) + '...' : q.text}</option>
    {/each}
  </select>

  {#if filterQuestionId && availableValues.length > 0}
    <select
      class="rounded-md border border-gray-300 bg-transparent px-2 py-1.5 text-xs dark:border-gray-600"
      value={filterValue}
      onchange={(e) => onFilterChange(filterQuestionId, (e.target as HTMLSelectElement).value)}
    >
      <option value="">Any value</option>
      {#each availableValues as val (val)}
        <option value={val}>{val}</option>
      {/each}
    </select>
  {/if}

  {#if isFiltered}
    <button
      class="inline-flex items-center gap-1 rounded-md bg-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      onclick={() => onFilterChange('', '')}
    >
      <Icon icon={mdiClose} size="12" />
      Clear filter
    </button>
  {/if}
</div>
