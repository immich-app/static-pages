<script lang="ts">
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';

  interface Props {
    question: SurveyQuestion;
    answer?: SurveyAnswer;
    onAnswer: (value: string) => void;
  }

  let { question, answer, onAnswer }: Props = $props();
  let selectedValue = $derived(answer?.value ?? '');

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onAnswer(target.value);
  }
</script>

<h2 class="mb-2 text-xl font-bold sm:text-2xl">{question.text}</h2>

{#if question.description}
  <p class="mb-6 text-base text-gray-500">{question.description}</p>
{/if}

<select
  class="focus:border-immich-primary dark:focus:border-immich-primary w-full appearance-none rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-base text-gray-900 transition-colors duration-150 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
  value={selectedValue}
  onchange={handleChange}
>
  <option value="" disabled>Select an option...</option>
  {#each question.options ?? [] as option (option.value)}
    <option value={option.value}>{option.label}</option>
  {/each}
</select>
