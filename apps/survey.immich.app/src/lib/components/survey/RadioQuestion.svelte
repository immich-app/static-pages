<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';
  import QuestionHeader from './QuestionHeader.svelte';

  interface Props {
    question: SurveyQuestion;
    answer?: SurveyAnswer;
    onAnswer: (value: string, otherText?: string) => void;
  }

  let { question, answer, onAnswer }: Props = $props();
  let otherText = $derived(answer?.otherText ?? '');

  const visibleOptions = $derived((question.options ?? []).filter((o) => !question.hasOther || o.value !== 'Other'));

  function select(value: string) {
    if (value === 'Other' && question.hasOther) {
      onAnswer(value, otherText);
    } else {
      onAnswer(value);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();

    const allValues = visibleOptions.map((o) => o.value);
    if (question.hasOther) allValues.push('Other');

    const currentIdx = answer?.value ? allValues.indexOf(answer.value) : -1;
    let nextIdx: number;

    if (e.key === 'ArrowDown') {
      nextIdx = currentIdx < allValues.length - 1 ? currentIdx + 1 : 0;
    } else {
      nextIdx = currentIdx > 0 ? currentIdx - 1 : allValues.length - 1;
    }

    select(allValues[nextIdx]);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onkeydown={handleKeydown}>
  <QuestionHeader text={question.text} description={question.description} />

  <div class="flex flex-col gap-3" role="radiogroup">
    {#each visibleOptions as option (option.value)}
      <button
        class="flex min-h-[44px] w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition-all duration-150
          {answer?.value === option.value
          ? 'border-immich-primary bg-immich-primary-10'
          : 'border-gray-200 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-400'}"
        onclick={() => select(option.value)}
        role="radio"
        aria-checked={answer?.value === option.value}
      >
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full {answer?.value === option.value
            ? 'bg-immich-primary text-white'
            : 'border-2 border-gray-300 dark:border-gray-500'}"
        >
          {#if answer?.value === option.value}
            <Icon icon={mdiCheck} size="14" />
          {/if}
        </span>
        <span class="text-base">{option.label}</span>
      </button>
    {/each}

    {#if question.hasOther}
      <div
        class="flex min-h-[44px] w-full items-center gap-3 rounded-lg border-2 p-4 transition-all duration-150
          {answer?.value === 'Other'
          ? 'border-immich-primary bg-immich-primary-10'
          : 'border-gray-200 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-400'}"
      >
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full {answer?.value === 'Other'
            ? 'bg-immich-primary text-white'
            : 'border-2 border-gray-300 dark:border-gray-500'}"
        >
          {#if answer?.value === 'Other'}
            <Icon icon={mdiCheck} size="14" />
          {/if}
        </span>
        <input
          type="text"
          class="flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
          placeholder={question.otherPrompt ?? 'Other...'}
          bind:value={otherText}
          onfocus={() => onAnswer('Other', otherText)}
          oninput={() => onAnswer('Other', otherText)}
        />
      </div>
    {/if}
  </div>
</div>
