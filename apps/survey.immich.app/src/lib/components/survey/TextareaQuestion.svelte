<script lang="ts">
  import { Textarea } from '@immich/ui';
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';

  interface Props {
    question: SurveyQuestion;
    answer?: SurveyAnswer;
    onAnswer: (value: string) => void;
  }

  let { question, answer, onAnswer }: Props = $props();
  let textValue = $derived(answer?.value ?? '');

  const maxLength = $derived(question.maxLength ?? 5000);

  $effect(() => {
    if (textValue.length > maxLength) {
      textValue = textValue.slice(0, maxLength);
    }
  });

  function handleInput() {
    onAnswer(textValue);
  }
</script>

<h2 class="mb-2 text-xl font-bold sm:text-2xl">{question.text}</h2>

{#if question.description}
  <p class="mb-6 text-base text-gray-500">{question.description}</p>
{/if}

<Textarea bind:value={textValue} rows={6} maxlength={maxLength} oninput={handleInput} />

<p class="mt-1 text-right text-sm text-gray-400">{textValue.length}/{maxLength}</p>
