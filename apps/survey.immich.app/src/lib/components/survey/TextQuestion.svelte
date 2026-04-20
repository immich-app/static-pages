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
  let textValue = $state('');

  $effect.pre(() => {
    textValue = answer?.value ?? '';
  });

  const { handleInput } = useDebouncedAnswer(
    () => textValue,
    (v) => onAnswer(v),
  );
</script>

<QuestionHeader text={question.text} description={question.description} />

<Input bind:value={textValue} placeholder={question.placeholder ?? ''} oninput={handleInput} />
