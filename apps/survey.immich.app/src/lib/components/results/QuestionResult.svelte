<script lang="ts">
  import type { SurveyQuestion } from '$lib/types';
  import BarChart from './BarChart.svelte';

  interface AnswerData {
    value: string;
    otherText: string | null;
    count: number;
  }

  interface Props {
    question: SurveyQuestion;
    answers: AnswerData[];
    totalResponses: number;
  }

  let { question, answers, totalResponses }: Props = $props();

  const sortedAnswers = $derived([...answers].sort((a, b) => b.count - a.count));

  const chartData = $derived(
    sortedAnswers.map((a) => ({
      label: a.value + (a.otherText ? `: ${a.otherText}` : ''),
      value: a.count,
      percentage: totalResponses > 0 ? (a.count / totalResponses) * 100 : 0,
    })),
  );
</script>

<div class="rounded-xl border border-gray-300 p-5 dark:border-gray-600">
  <h3 class="mb-1 text-base font-semibold">{question.text}</h3>
  <p class="mb-4 text-sm text-gray-500">{answers.reduce((sum, a) => sum + a.count, 0)} responses</p>

  {#if ['radio', 'checkbox'].includes(question.type)}
    <BarChart data={chartData} />
  {:else}
    <div class="space-y-2">
      {#each sortedAnswers.slice(0, 20) as answer (answer.value)}
        <div class="rounded-lg bg-gray-100 p-3 text-sm dark:bg-gray-800">
          <p>{answer.value}</p>
          {#if answer.count > 1}
            <span class="text-xs text-gray-400">({answer.count}x)</span>
          {/if}
        </div>
      {/each}
      {#if sortedAnswers.length > 20}
        <p class="text-sm text-gray-500">...and {sortedAnswers.length - 20} more responses</p>
      {/if}
    </div>
  {/if}
</div>
