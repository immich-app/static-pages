<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiStar, mdiStarOutline } from '@mdi/js';
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';
  import QuestionHeader from './QuestionHeader.svelte';

  interface Props {
    question: SurveyQuestion;
    answer?: SurveyAnswer;
    onAnswer: (value: string) => void;
  }

  let { question, answer, onAnswer }: Props = $props();

  const scaleMax = $derived(question.config?.scaleMax ?? 5);
  const selectedValue = $derived(answer?.value ? Number(answer.value) : 0);
  let hoverValue = $state(0);
</script>

<QuestionHeader text={question.text} description={question.description} />

<div class="flex flex-col gap-2">
  <div class="flex items-center gap-2 sm:gap-1">
    {#each Array.from({ length: scaleMax }, (_, i) => i + 1) as star (star)}
      <button
        class="transition-transform duration-150 hover:scale-110 focus:outline-none"
        data-rating-value={star}
        onmouseenter={() => (hoverValue = star)}
        onmouseleave={() => (hoverValue = 0)}
        onclick={() => onAnswer(String(star))}
        aria-label="Rate {star} out of {scaleMax}"
      >
        <Icon
          icon={star <= (hoverValue || selectedValue) ? mdiStar : mdiStarOutline}
          size="40"
          class="transition-colors duration-150 {star <= (hoverValue || selectedValue)
            ? 'text-immich-primary'
            : 'text-gray-300 dark:text-gray-600'}"
        />
      </button>
    {/each}
  </div>

  {#if question.config?.scaleLabels}
    <div class="flex justify-between text-sm text-gray-400">
      <span>{question.config.scaleLabels.low}</span>
      <span>{question.config.scaleLabels.high}</span>
    </div>
  {/if}
</div>
