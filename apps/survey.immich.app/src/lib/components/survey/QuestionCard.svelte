<script lang="ts">
  import { Button } from '@immich/ui';
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';
  import RadioQuestion from './RadioQuestion.svelte';
  import CheckboxQuestion from './CheckboxQuestion.svelte';
  import TextQuestion from './TextQuestion.svelte';
  import TextareaQuestion from './TextareaQuestion.svelte';
  import EmailQuestion from './EmailQuestion.svelte';
  import RatingQuestion from './RatingQuestion.svelte';
  import NpsQuestion from './NpsQuestion.svelte';
  import NumberQuestion from './NumberQuestion.svelte';
  import DropdownQuestion from './DropdownQuestion.svelte';
  import LikertQuestion from './LikertQuestion.svelte';
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    question: SurveyQuestion;
    answer?: SurveyAnswer;
    onAnswer: (value: string, otherText?: string) => void;
    onNext: () => void;
    onBack: () => void;
    canGoBack: boolean;
    isLast?: boolean;
  }

  let { question, answer, onAnswer, onNext, onBack, canGoBack, isLast = false }: Props = $props();

  const hasAnswer = $derived(!!answer?.value);
  const isOptional = $derived(!question.required);
  let validationError = $state<string | null>(null);

  let autoNextTimer: ReturnType<typeof setTimeout> | undefined;

  function handleRadioAnswer(value: string, otherText?: string) {
    onAnswer(value, otherText);
    validationError = null;
    if (value !== 'Other' || !question.hasOther) {
      clearTimeout(autoNextTimer);
      autoNextTimer = setTimeout(() => onNext(), 200);
    }
  }

  function handleAnswer(value: string, otherText?: string) {
    onAnswer(value, otherText);
    validationError = null;
  }

  function handleNext() {
    if (question.required && !hasAnswer) {
      validationError = 'This question is required';
      return;
    }
    validationError = null;
    onNext();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA') return;
      if (target.tagName === 'INPUT' && target.getAttribute('type') === 'text') {
        e.preventDefault();
        handleNext();
      }
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
    clearTimeout(autoNextTimer);
  });
</script>

<div class="w-full max-w-[640px] px-4 sm:px-6">
  <div class={validationError ? 'rounded-lg border-2 border-red-500/30 p-4' : ''}>
    {#if question.type === 'radio'}
      <RadioQuestion {question} {answer} onAnswer={handleRadioAnswer} />
    {:else if question.type === 'checkbox'}
      <CheckboxQuestion {question} {answer} onAnswer={handleAnswer} />
    {:else if question.type === 'text'}
      <TextQuestion {question} {answer} onAnswer={(v) => handleAnswer(v)} />
    {:else if question.type === 'email'}
      <EmailQuestion {question} {answer} onAnswer={(v) => handleAnswer(v)} />
    {:else if question.type === 'textarea'}
      <TextareaQuestion {question} {answer} onAnswer={(v) => handleAnswer(v)} />
    {:else if question.type === 'rating'}
      <RatingQuestion {question} {answer} onAnswer={(v) => handleAnswer(v)} />
    {:else if question.type === 'nps'}
      <NpsQuestion {question} {answer} onAnswer={(v) => handleAnswer(v)} />
    {:else if question.type === 'number'}
      <NumberQuestion {question} {answer} onAnswer={(v) => handleAnswer(v)} />
    {:else if question.type === 'dropdown'}
      <DropdownQuestion {question} {answer} onAnswer={(v) => handleAnswer(v)} />
    {:else if question.type === 'likert'}
      <LikertQuestion {question} {answer} onAnswer={(v) => handleAnswer(v)} />
    {/if}
  </div>

  {#if validationError}
    <p class="mt-2 text-sm text-red-400">{validationError}</p>
  {/if}
</div>

<div
  class="bg-light fixed bottom-0 left-0 z-40 flex w-full justify-center border-t border-gray-200 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-4 dark:border-gray-800"
>
  <div class="flex w-full max-w-[640px] items-center gap-3">
    {#if canGoBack}
      <Button variant="outline" onclick={onBack}>Back</Button>
    {/if}
    <Button color="primary" onclick={handleNext}>
      {isLast ? 'Submit' : hasAnswer || !isOptional ? 'Next' : 'Skip'}
    </Button>
  </div>
</div>
