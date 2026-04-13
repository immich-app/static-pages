<script lang="ts">
  import { Input } from '@immich/ui';
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

<Input bind:value={textValue} placeholder={question.placeholder ?? ''} oninput={handleInput} />
