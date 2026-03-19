<script lang="ts">
  import { Icon, Input } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';

  interface Props {
    question: SurveyQuestion;
    answer?: SurveyAnswer;
    onAnswer: (value: string, otherText?: string) => void;
  }

  let { question, answer, onAnswer }: Props = $props();
  let otherText = $state('');

  $effect(() => {
    otherText = answer?.otherText ?? '';
  });
  function select(value: string) {
    if (value === 'Other' && question.hasOther) {
      onAnswer(value, otherText);
    } else {
      onAnswer(value);
    }
  }
</script>

<h2 class="mb-2 text-2xl font-bold">{question.text}</h2>

{#if question.description}
  <p class="mb-6 text-base text-gray-500">{@html question.description}</p>
{/if}

<div class="flex flex-col gap-3">
  {#each (question.options ?? []).filter((o) => !question.hasOther || o.value !== 'Other') as option}
    <button
      class="flex min-h-12 w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition-all duration-150
        {answer?.value === option.value
        ? 'border-immich-primary bg-immich-primary-10'
        : 'border-gray-200 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-400'}"
      onclick={() => select(option.value)}
    >
      <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full {answer?.value === option.value ? 'bg-immich-primary text-white' : 'border-2 border-gray-300 dark:border-gray-500'}">
        {#if answer?.value === option.value}
          <Icon icon={mdiCheck} size="14" />
        {/if}
      </span>
      <span class="text-base">{option.label}</span>
    </button>
  {/each}

  {#if question.hasOther}
    <div
      class="flex min-h-12 w-full items-center gap-3 rounded-lg border-2 p-4 transition-all duration-150
        {answer?.value === 'Other'
        ? 'border-immich-primary bg-immich-primary-10'
        : 'border-gray-200 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-400'}"
    >
      <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full {answer?.value === 'Other' ? 'bg-immich-primary text-white' : 'border-2 border-gray-300 dark:border-gray-500'}">
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
