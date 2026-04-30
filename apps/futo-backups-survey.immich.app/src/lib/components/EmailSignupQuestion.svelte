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

  let emailValue = $state('');
  let selected = $state<Set<string>>(new Set());
  let initialized = false;

  $effect(() => {
    emailValue = answer?.value ?? '';
    if (answer?.otherText) {
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      selected = new Set(answer.otherText.split(','));
    } else if (!initialized) {
      // Pre-check all options by default
      selected = new Set((question.options ?? []).map((o) => o.value));
    }
    initialized = true;
  });

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = $derived(emailValue.length > 0 && emailPattern.test(emailValue));

  function emitAnswer() {
    if (isValid && selected.size > 0) {
      onAnswer(emailValue, [...selected].join(','));
    }
  }

  function toggleOption(value: string) {
    if (selected.has(value)) {
      selected.delete(value);
    } else {
      selected.add(value);
    }
    selected = new Set(selected);
    emitAnswer();
  }

  function handleInput() {
    emitAnswer();
  }
</script>

<h2 class="mb-2 text-2xl font-bold">{question.text}</h2>

{#if question.description}
  <p class="mb-6 text-base text-gray-500">{question.description}</p>
{/if}

<Input
  type="email"
  placeholder={question.placeholder ?? 'name@example.com'}
  bind:value={emailValue}
  size="medium"
  oninput={handleInput}
/>

<div class="mt-4 flex flex-col gap-3">
  {#each question.options ?? [] as option, i (i)}
    <button
      class="flex min-h-12 w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition-all duration-150
        {selected.has(option.value)
        ? 'border-immich-primary bg-immich-primary-10'
        : 'border-gray-200 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-400'}"
      onclick={() => toggleOption(option.value)}
    >
      <span
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded {selected.has(option.value)
          ? 'bg-immich-primary text-white'
          : 'border-2 border-gray-300 dark:border-gray-500'}"
      >
        {#if selected.has(option.value)}
          <Icon icon={mdiCheck} size="14" />
        {/if}
      </span>
      <span class="text-base">{option.label}</span>
    </button>
  {/each}
</div>

<p class="mt-3 text-sm text-gray-500">
  If you only select the closed beta, we'll never email you except for the beta invite.
</p>
