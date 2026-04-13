<script lang="ts">
  import { Textarea } from '@immich/ui';
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';
  import QuestionHeader from './QuestionHeader.svelte';
  import { onDestroy } from 'svelte';

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

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => onAnswer(textValue), 300);
  }
  onDestroy(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      onAnswer(textValue);
    }
  });
</script>

<QuestionHeader text={question.text} description={question.description} />

<Textarea
  bind:value={textValue}
  rows={6}
  maxlength={maxLength}
  placeholder={question.placeholder ?? ''}
  oninput={handleInput}
/>

<p class="mt-1 text-right text-sm text-gray-400">{textValue.length}/{maxLength}</p>
