<script lang="ts">
  import { Input } from '@immich/ui';
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';
  import QuestionHeader from './QuestionHeader.svelte';

  interface Props {
    question: SurveyQuestion;
    answer?: SurveyAnswer;
    onAnswer: (value: string) => void;
  }

  let { question, answer, onAnswer }: Props = $props();
  let email = $derived(answer?.value ?? '');

  function handleInput() {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      onAnswer(email);
    }
  }
</script>

<QuestionHeader text={question.text} description={question.description} />

<Input type="email" bind:value={email} placeholder={question.placeholder ?? 'your@email.com'} oninput={handleInput} />
