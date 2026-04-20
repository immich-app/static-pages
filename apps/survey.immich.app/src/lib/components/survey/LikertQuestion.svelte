<script lang="ts">
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';
  import QuestionHeader from './QuestionHeader.svelte';

  interface Props {
    question: SurveyQuestion;
    answer?: SurveyAnswer;
    onAnswer: (value: string) => void;
  }

  let { question, answer, onAnswer }: Props = $props();

  const labels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] as const;
  const lowLabel = $derived(typeof question.config?.lowLabel === 'string' ? question.config.lowLabel : '');
  const highLabel = $derived(typeof question.config?.highLabel === 'string' ? question.config.highLabel : '');
  const showScaleLabels = $derived(lowLabel !== '' || highLabel !== '');
</script>

<QuestionHeader text={question.text} description={question.description} />

<div class="flex flex-col gap-2">
  <div class="flex flex-col gap-2 sm:flex-row sm:gap-1.5">
    {#each labels as label (label)}
      <button
        class="flex-1 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all duration-150
          {answer?.value === label
          ? 'border-immich-primary bg-immich-primary-10 text-immich-primary'
          : 'border-gray-200 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-400'}"
        onclick={() => onAnswer(label)}
      >
        <span class="hidden sm:inline">{label}</span>
        <span class="sm:hidden">{label}</span>
      </button>
    {/each}
  </div>

  {#if showScaleLabels}
    <div class="flex justify-between text-sm text-gray-400">
      <span>{lowLabel}</span>
      <span>{highLabel}</span>
    </div>
  {/if}
</div>
