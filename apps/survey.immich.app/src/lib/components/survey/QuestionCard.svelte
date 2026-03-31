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

  let autoNextTimer: ReturnType<typeof setTimeout> | undefined;

  function handleRadioAnswer(value: string, otherText?: string) {
    onAnswer(value, otherText);
    if (value !== 'Other' || !question.hasOther) {
      clearTimeout(autoNextTimer);
      autoNextTimer = setTimeout(() => onNext(), 200);
    }
  }
</script>

<div class="w-full max-w-[640px] px-4">
  {#if question.type === 'radio'}
    <RadioQuestion {question} {answer} onAnswer={handleRadioAnswer} />
  {:else if question.type === 'checkbox'}
    <CheckboxQuestion {question} {answer} {onAnswer} />
  {:else if question.type === 'text'}
    <TextQuestion {question} {answer} onAnswer={(v) => onAnswer(v)} />
  {:else if question.type === 'email'}
    <EmailQuestion {question} {answer} onAnswer={(v) => onAnswer(v)} />
  {:else if question.type === 'textarea'}
    <TextareaQuestion {question} {answer} onAnswer={(v) => onAnswer(v)} />
  {:else if question.type === 'rating'}
    <RatingQuestion {question} {answer} onAnswer={(v) => onAnswer(v)} />
  {:else if question.type === 'nps'}
    <NpsQuestion {question} {answer} onAnswer={(v) => onAnswer(v)} />
  {:else if question.type === 'number'}
    <NumberQuestion {question} {answer} onAnswer={(v) => onAnswer(v)} />
  {:else if question.type === 'dropdown'}
    <DropdownQuestion {question} {answer} onAnswer={(v) => onAnswer(v)} />
  {:else if question.type === 'likert'}
    <LikertQuestion {question} {answer} onAnswer={(v) => onAnswer(v)} />
  {/if}
</div>

<div class="bg-light fixed bottom-0 left-0 z-40 flex w-full justify-center px-4 pt-4 pb-6">
  <div class="flex w-full max-w-[640px] items-center gap-3">
    {#if canGoBack}
      <Button variant="outline" onclick={onBack}>Back</Button>
    {/if}
    <Button color="primary" disabled={!hasAnswer && !isOptional} onclick={onNext}>
      {isLast ? 'Submit' : hasAnswer || !isOptional ? 'Next' : 'Skip'}
    </Button>
  </div>
</div>
