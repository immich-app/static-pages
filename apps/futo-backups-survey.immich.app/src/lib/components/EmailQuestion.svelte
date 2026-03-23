<script lang="ts">
  import { Input } from '@immich/ui';
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';

  interface Props {
    question: SurveyQuestion;
    answer?: SurveyAnswer;
    onAnswer: (value: string) => void;
  }

  let { question, answer, onAnswer }: Props = $props();
  let emailValue = $state('');

  $effect(() => {
    emailValue = answer?.value ?? '';
  });

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = $derived(emailValue.length > 0 && emailPattern.test(emailValue));

  function handleInput() {
    if (isValid) {
      onAnswer(emailValue);
    }
  }
</script>

<h2 class="mb-2 text-2xl font-bold">{question.text}</h2>

{#if question.description}
  <p class="mb-6 text-base text-gray-500">{question.description}</p>
{/if}

<Input
  type="email"
  placeholder={question.placeholder ?? 'name@example.com'}
  bind:value={emailValue}
  size="medium"
  oninput={handleInput}
/>
