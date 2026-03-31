<script lang="ts">
  import { Input } from '@immich/ui';
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';

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
</script>

<h2 class="mb-2 text-xl font-bold sm:text-2xl">{question.text}</h2>

{#if question.description}
  <p class="mb-6 text-base text-gray-500">{question.description}</p>
{/if}

<Input
  type="number"
  bind:value={numberValue}
  placeholder={question.placeholder ?? ''}
  {min}
  {max}
  oninput={() => onAnswer(numberValue)}
/>

{#if hasHint}
  <p class="mt-1 text-sm text-gray-400">{hintText}</p>
{/if}
