<script lang="ts">
  import { Input } from '@immich/ui';
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';
  import QuestionHeader from './QuestionHeader.svelte';
  import { useDebouncedAnswer } from './use-debounced-answer';

  interface Props {
    question: SurveyQuestion;
    answer?: SurveyAnswer;
    onAnswer: (value: string) => void;
  }

  let { question, answer, onAnswer }: Props = $props();
  let numberValue = $state('');

  $effect.pre(() => {
    numberValue = answer?.value ?? '';
  });

  const min = $derived(question.config?.min);
  const max = $derived(question.config?.max);
  const hasHint = $derived(min !== undefined || max !== undefined);
  const hintText = $derived(
    [min !== undefined ? `Min: ${min}` : '', max !== undefined ? `Max: ${max}` : ''].filter(Boolean).join(', '),
  );

  const { handleInput } = useDebouncedAnswer(
    () => numberValue,
    (v) => onAnswer(v),
  );
</script>

<QuestionHeader text={question.text} description={question.description} />

<Input
  type="number"
  bind:value={numberValue}
  placeholder={question.placeholder ?? ''}
  {min}
  {max}
  oninput={handleInput}
/>

{#if hasHint}
  <p class="mt-1 text-sm text-gray-400">{hintText}</p>
{/if}
