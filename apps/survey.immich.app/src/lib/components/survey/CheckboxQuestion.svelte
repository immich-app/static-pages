<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';
  import { SvelteSet } from 'svelte/reactivity';
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';

  interface Props {
    question: SurveyQuestion;
    answer?: SurveyAnswer;
    onAnswer: (value: string, otherText?: string) => void;
  }

  let { question, answer, onAnswer }: Props = $props();
  let otherText = $derived(answer?.otherText ?? '');

  const selectedValues = $derived<SvelteSet<string>>(new SvelteSet(answer?.value ? answer.value.split(',') : []));

  function toggle(value: string) {
    const current = new SvelteSet(selectedValues);
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }
    const newValue = [...current].join(',');
    if (value === 'Other' && question.hasOther) {
      onAnswer(newValue, otherText);
    } else {
      onAnswer(newValue, selectedValues.has('Other') ? otherText : undefined);
    }
  }
</script>

<h2 class="mb-2 text-2xl font-bold">{question.text}</h2>

{#if question.description}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  <p class="mb-6 text-base text-gray-500">{@html question.description}</p>
{/if}

<p class="mb-4 text-sm text-gray-400">Select all that apply</p>

<div class="flex flex-col gap-3">
  {#each (question.options ?? []).filter((o) => !question.hasOther || o.value !== 'Other') as option (option.value)}
    <button
      class="flex min-h-12 w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition-all duration-150
        {selectedValues.has(option.value)
        ? 'border-immich-primary bg-immich-primary-10'
        : 'border-gray-200 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-400'}"
      onclick={() => toggle(option.value)}
    >
      <span
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md {selectedValues.has(option.value)
          ? 'bg-immich-primary text-white'
          : 'border-2 border-gray-300 dark:border-gray-500'}"
      >
        {#if selectedValues.has(option.value)}
          <Icon icon={mdiCheck} size="14" />
        {/if}
      </span>
      <span class="text-base">{option.label}</span>
    </button>
  {/each}

  {#if question.hasOther}
    <div
      class="flex min-h-12 w-full items-center gap-3 rounded-lg border-2 p-4 transition-all duration-150
        {selectedValues.has('Other')
        ? 'border-immich-primary bg-immich-primary-10'
        : 'border-gray-200 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-400'}"
    >
      <button
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md {selectedValues.has('Other')
          ? 'bg-immich-primary text-white'
          : 'border-2 border-gray-300 dark:border-gray-500'}"
        onclick={() => toggle('Other')}
      >
        {#if selectedValues.has('Other')}
          <Icon icon={mdiCheck} size="14" />
        {/if}
      </button>
      <input
        type="text"
        class="flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
        placeholder={question.otherPrompt ?? 'Other...'}
        bind:value={otherText}
        onfocus={() => {
          if (!selectedValues.has('Other')) toggle('Other');
        }}
        oninput={() => {
          const vals = [...selectedValues];
          if (!vals.includes('Other')) vals.push('Other');
          onAnswer(vals.join(','), otherText);
        }}
      />
    </div>
  {/if}
</div>
