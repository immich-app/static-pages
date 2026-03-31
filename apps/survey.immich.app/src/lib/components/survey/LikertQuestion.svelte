<script lang="ts">
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';

  interface Props {
    question: SurveyQuestion;
    answer?: SurveyAnswer;
    onAnswer: (value: string) => void;
  }

  let { question, answer, onAnswer }: Props = $props();

  const labels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] as const;
</script>

<h2 class="mb-2 text-xl font-bold sm:text-2xl">{question.text}</h2>

{#if question.description}
  <p class="mb-6 text-base text-gray-500">{question.description}</p>
{/if}

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

  {#if question.config?.scaleLabels}
    <div class="flex justify-between text-sm text-gray-400">
      <span>{question.config.scaleLabels.low}</span>
      <span>{question.config.scaleLabels.high}</span>
    </div>
  {/if}
</div>
