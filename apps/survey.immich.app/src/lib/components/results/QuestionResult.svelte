<script lang="ts">
  import type { SurveyQuestion } from '$lib/types';
  import ChoiceResult from './ChoiceResult.svelte';
  import RatingResult from './RatingResult.svelte';
  import NpsResult from './NpsResult.svelte';
  import LikertResult from './LikertResult.svelte';
  import NumberResult from './NumberResult.svelte';
  import TextResult from './TextResult.svelte';
  import type { AnswerData } from './analytics-utils';

  interface Props {
    question: SurveyQuestion;
    answers: AnswerData[];
    /** Total number of completed respondents for this survey (denominator for % calculations). */
    totalResponses: number;
    /** Called when the user wants to browse all individual responses. */
    onViewAllResponses?: () => void;
  }

  let { question, answers, totalResponses, onViewAllResponses }: Props = $props();

  // Response count for THIS specific question — sum of all answer counts.
  // For checkbox this is the total combinations, not total selections; ChoiceResult
  // handles its own denominator logic.
  const responseCount = $derived(answers.reduce((sum, a) => sum + a.count, 0));
  const skipCount = $derived(Math.max(0, totalResponses - responseCount));
  const skipRate = $derived(totalResponses > 0 ? (skipCount / totalResponses) * 100 : 0);

  // Question type badge
  const typeLabel = $derived(
    {
      radio: 'Single choice',
      checkbox: 'Multi-select',
      dropdown: 'Dropdown',
      text: 'Short text',
      textarea: 'Long text',
      email: 'Email',
      number: 'Number',
      rating: 'Rating',
      nps: 'NPS',
      likert: 'Likert',
    }[question.type] ?? question.type,
  );
</script>

<div class="rounded-xl border border-gray-300 p-5 dark:border-gray-700">
  <!-- Header -->
  <div class="mb-4">
    <div class="mb-1 flex items-start justify-between gap-3">
      <h3 class="text-base leading-snug font-semibold">{question.text}</h3>
      <span
        class="shrink-0 rounded-full border border-gray-700 px-2 py-0.5 text-[10px] tracking-wider text-gray-500 uppercase"
      >
        {typeLabel}
      </span>
    </div>
    {#if question.description}
      <p class="mb-2 text-xs text-gray-500">{question.description}</p>
    {/if}
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
      <span>{responseCount} {responseCount === 1 ? 'response' : 'responses'}</span>
      {#if skipCount > 0}
        <span class="text-amber-500/80">· {skipCount} skipped ({skipRate.toFixed(0)}%)</span>
      {/if}
    </div>
  </div>

  <!-- Type-specific visualization -->
  {#if question.type === 'radio' || question.type === 'dropdown' || question.type === 'checkbox'}
    <ChoiceResult {question} {answers} />
  {:else if question.type === 'rating'}
    <RatingResult {question} {answers} />
  {:else if question.type === 'nps'}
    <NpsResult {answers} />
  {:else if question.type === 'likert'}
    <LikertResult {answers} />
  {:else if question.type === 'number'}
    <NumberResult {answers} />
  {:else if question.type === 'text' || question.type === 'textarea' || question.type === 'email'}
    <TextResult {question} {answers} {onViewAllResponses} />
  {:else}
    <p class="text-sm text-gray-500">No visualization available for type "{question.type}".</p>
  {/if}
</div>
