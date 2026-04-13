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
  let email = $derived(answer?.value ?? '');

  const validEmail = () => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '');
  const { handleInput } = useDebouncedAnswer(validEmail, onAnswer);
</script>

<QuestionHeader text={question.text} description={question.description} />

<Input type="email" bind:value={email} placeholder={question.placeholder ?? 'your@email.com'} oninput={handleInput} />
