<script lang="ts">
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';

  interface Props {
    question: SurveyQuestion;
    answer?: SurveyAnswer;
    onAnswer: (value: string) => void;
  }

  let { question, answer, onAnswer }: Props = $props();

  const selectedValue = $derived(answer?.value !== undefined ? Number(answer.value) : -1);

  function getColor(n: number, isSelected: boolean): string {
    if (isSelected) {
      if (n <= 6) return 'bg-red-500 text-white border-red-500';
      if (n <= 8) return 'bg-amber-500 text-white border-amber-500';
      return 'bg-green-500 text-white border-green-500';
    }
    if (n <= 6) return 'border-red-300 text-red-400 hover:bg-red-500/10 dark:border-red-700 dark:text-red-400';
    if (n <= 8)
      return 'border-amber-300 text-amber-500 hover:bg-amber-500/10 dark:border-amber-600 dark:text-amber-400';
    return 'border-green-300 text-green-500 hover:bg-green-500/10 dark:border-green-700 dark:text-green-400';
  }
</script>

<h2 class="mb-2 text-2xl font-bold">{question.text}</h2>

{#if question.description}
  <p class="mb-6 text-base text-gray-500">{question.description}</p>
{/if}

<div class="flex flex-col gap-2">
  <div class="grid grid-cols-11 gap-1.5">
    {#each Array.from({ length: 11 }, (_, i) => i) as n (n)}
      <button
        class="flex h-10 items-center justify-center rounded-md border-2 text-sm font-semibold transition-all duration-150
          {getColor(n, selectedValue === n)}"
        onclick={() => onAnswer(String(n))}
        aria-label="Score {n}"
      >
        {n}
      </button>
    {/each}
  </div>

  <div class="flex justify-between text-sm text-gray-400">
    <span>Not at all likely</span>
    <span>Extremely likely</span>
  </div>
</div>
