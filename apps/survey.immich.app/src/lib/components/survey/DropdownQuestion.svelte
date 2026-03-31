<script lang="ts">
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';
  import QuestionHeader from './QuestionHeader.svelte';

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

<QuestionHeader text={question.text} description={question.description} />

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
