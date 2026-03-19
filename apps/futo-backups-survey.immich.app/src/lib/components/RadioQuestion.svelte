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
  <p class="mb-6 text-base text-gray-500">{question.description}</p>
{/if}

<div class="flex flex-col gap-3">
  {#each (question.options ?? []).filter((o) => !question.hasOther || o.value !== 'Other') as option}
    <button
      class="flex min-h-12 w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition-all duration-150
        {answer?.value === option.value
        ? 'border-[var(--immich-primary)] bg-[var(--immich-primary)]/10'
        : 'border-gray-200 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-400'}"
      onclick={() => select(option.value)}
    >
      {#if answer?.value === option.value}
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[var(--immich-primary)] text-white">
          <Icon icon={mdiCheck} size="18" />
        </span>
      {:else}
        <span class="h-4 w-4 shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-500"></span>
      {/if}
      <span class="text-base">{option.label}</span>
    </button>
  {/each}

  {#if question.hasOther}
    <div
      class="flex min-h-12 w-full items-center gap-3 rounded-lg border-2 p-4 transition-all duration-150
        {answer?.value === 'Other'
        ? 'border-[var(--immich-primary)] bg-[var(--immich-primary)]/10'
        : 'border-gray-200 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-400'}"
    >
      {#if answer?.value === 'Other'}
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[var(--immich-primary)] text-white">
          <Icon icon={mdiCheck} size="18" />
        </span>
      {:else}
        <span class="h-4 w-4 shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-500"></span>
      {/if}
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
