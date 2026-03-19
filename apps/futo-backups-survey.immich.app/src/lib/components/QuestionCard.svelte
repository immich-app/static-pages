<script lang="ts">
  import { Button } from '@immich/ui';
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';
  import RadioQuestion from './RadioQuestion.svelte';
  import EmailQuestion from './EmailQuestion.svelte';
  import EmailSignupQuestion from './EmailSignupQuestion.svelte';
  import TextareaQuestion from './TextareaQuestion.svelte';

  interface Props {
    question: SurveyQuestion;
    answer?: SurveyAnswer;
    onAnswer: (value: string, otherText?: string) => void;
    onNext: () => void;
    onBack: () => void;
    canGoBack: boolean;
  }

  let { question, answer, onAnswer, onNext, onBack, canGoBack }: Props = $props();

  const hasAnswer = $derived(!!answer?.value);
  const isOptional = $derived(!question.required);

  let autoNextTimer: ReturnType<typeof setTimeout> | undefined;

  function handleRadioAnswer(value: string, otherText?: string) {
    onAnswer(value, otherText);
    // Auto-advance on radio pick (but not for "Other" with text input)
    if (value !== 'Other' || !question.hasOther) {
      clearTimeout(autoNextTimer);
      autoNextTimer = setTimeout(() => onNext(), 200);
    }
  }
</script>

<div class="w-full max-w-[640px] px-4">
  {#if question.type === 'radio'}
    <RadioQuestion {question} {answer} onAnswer={handleRadioAnswer} />
  {:else if question.type === 'email'}
    <EmailQuestion {question} {answer} onAnswer={(v) => onAnswer(v)} />
  {:else if question.type === 'email-signup'}
    <EmailSignupQuestion {question} {answer} {onAnswer} />
  {:else if question.type === 'textarea'}
    <TextareaQuestion {question} {answer} onAnswer={(v) => onAnswer(v)} />
  {/if}
</div>

<div class="fixed bottom-0 left-0 z-40 flex w-full justify-center bg-light px-4 pb-6 pt-4">
  <div class="flex w-full max-w-[640px] items-center gap-3">
    {#if canGoBack}
      <Button variant="outline" onclick={onBack}>Back</Button>
    {/if}
    <Button
      color="primary"
      disabled={!hasAnswer && !isOptional}
      onclick={onNext}
    >
      {hasAnswer || !isOptional ? 'Next' : 'Skip'}
    </Button>
  </div>
</div>
