<script lang="ts">
  import { Button } from '@immich/ui';
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';
  import RadioQuestion from './RadioQuestion.svelte';
  import EmailQuestion from './EmailQuestion.svelte';
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
</script>

<div class="w-full max-w-[640px] px-4">
  {#if question.type === 'radio'}
    <RadioQuestion {question} {answer} {onAnswer} />
  {:else if question.type === 'email'}
    <EmailQuestion {question} {answer} onAnswer={(v) => onAnswer(v)} />
  {:else if question.type === 'textarea'}
    <TextareaQuestion {question} {answer} onAnswer={(v) => onAnswer(v)} />
  {/if}

  <div class="mt-8 flex items-center gap-3">
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
