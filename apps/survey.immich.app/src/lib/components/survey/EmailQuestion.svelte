<script lang="ts">
  import { Input } from '@immich/ui';
  import type { SurveyQuestion, SurveyAnswer } from '$lib/types';

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

<h2 class="mb-2 text-2xl font-bold">{question.text}</h2>

{#if question.description}
  <p class="mb-6 text-base text-gray-500">{question.description}</p>
{/if}

<Input type="email" bind:value={email} placeholder={question.placeholder ?? 'your@email.com'} oninput={handleInput} />
