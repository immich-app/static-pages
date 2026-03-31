<script lang="ts">
  import type { SurveyQuestion } from '$lib/types';
  import BarChart from './BarChart.svelte';
  import PieChart from './PieChart.svelte';
  import ChartTypeToggle from './ChartTypeToggle.svelte';
  import NpsScoreCard from './NpsScoreCard.svelte';
  import WordCloud from './WordCloud.svelte';

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

  let chartType = $state<'bar' | 'pie'>('bar');
  let showWordCloud = $state(false);

  const sortedAnswers = $derived([...answers].sort((a, b) => b.count - a.count));

  const chartData = $derived(
    sortedAnswers.map((a) => ({
      label: a.value + (a.otherText ? `: ${a.otherText}` : ''),
      value: a.count,
      percentage: totalResponses > 0 ? (a.count / totalResponses) * 100 : 0,
    })),
  );

  const isChartType = $derived(['radio', 'checkbox', 'dropdown', 'rating', 'nps', 'likert'].includes(question.type));

  const isTextType = $derived(['text', 'textarea', 'email'].includes(question.type));

  const wordCloudData = $derived(isTextType ? sortedAnswers.map((a) => ({ text: a.value, count: a.count })) : []);
</script>

<div class="rounded-xl border border-gray-300 p-5 dark:border-gray-600">
  <div class="mb-1 flex items-start justify-between gap-2">
    <h3 class="text-base font-semibold">{question.text}</h3>
    {#if isChartType}
      <ChartTypeToggle value={chartType} onChange={(t) => (chartType = t)} />
    {/if}
  </div>
  <p class="mb-4 text-sm text-gray-500">{answers.reduce((sum, a) => sum + a.count, 0)} responses</p>

  {#if isChartType}
    {#if chartType === 'bar'}
      <BarChart data={chartData} />
    {:else}
      <PieChart data={chartData} />
    {/if}
    {#if question.type === 'nps'}
      <NpsScoreCard {answers} />
    {/if}
  {:else}
    {#if isTextType && wordCloudData.length > 2}
      <div class="mb-3">
        <button
          class="text-xs text-gray-400 underline-offset-2 hover:text-gray-300 hover:underline"
          onclick={() => (showWordCloud = !showWordCloud)}
        >
          {showWordCloud ? 'Hide' : 'Show'} word cloud
        </button>
      </div>
      {#if showWordCloud}
        <div class="mb-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <WordCloud words={wordCloudData} />
        </div>
      {/if}
    {/if}
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
