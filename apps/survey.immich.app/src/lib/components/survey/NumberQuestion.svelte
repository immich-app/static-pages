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
  let numberValue = $derived(answer?.value ?? '');

  const min = $derived(question.config?.min);
  const max = $derived(question.config?.max);
  const hasHint = $derived(min !== undefined || max !== undefined);
  const hintText = $derived(
    [min !== undefined ? `Min: ${min}` : '', max !== undefined ? `Max: ${max}` : ''].filter(Boolean).join(', '),
  );

  // `bind:value` on a type="number" input yields a number, but answers are
  // strings end to end (validateAnswer/server call value.trim()). Coerce here so
  // a number never leaks into the answer pipeline.
  const { handleInput } = useDebouncedAnswer(
    () => String(numberValue ?? ''),
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
