<script lang="ts">
  import { onMount } from 'svelte';
  import { createSurveyEngine } from '$lib/survey-engine.svelte';
  import { fetchResume, fireAndForgetSave, postComplete, onSaveError } from '$lib/api-client';
  import SurveyShell from '$lib/components/SurveyShell.svelte';
  import ThankYouScreen from '$lib/components/ThankYouScreen.svelte';
  import AlreadyCompleted from '$lib/components/AlreadyCompleted.svelte';
  import WelcomeScreen from '$lib/components/WelcomeScreen.svelte';

  const engine = createSurveyEngine();
  let loading = $state(true);
  let alreadyCompleted = $state(false);
  let surveyFinished = $state(false);
  let showWelcome = $state(false);
  let error = $state<string | null>(null);

  onSaveError((message) => {
    error = message;
  });

  onMount(async () => {
    try {
      const resume = await fetchResume();
      if (resume.isComplete) {
        alreadyCompleted = true;
      } else if (resume.answers && resume.nextQuestionIndex !== undefined && resume.nextQuestionIndex > 0) {
        engine.initialize(resume.answers, resume.nextQuestionIndex);
      } else {
        showWelcome = true;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Something went wrong. Please try again later.';
    }
    loading = false;
  });

  function handleAnswer(questionId: string, value: string, otherText?: string) {
    engine.setAnswer(questionId, value, otherText);
    fireAndForgetSave({ questionId, value, otherText });
  }

  async function handleComplete() {
    try {
      await postComplete();
      surveyFinished = true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to submit survey. Please try again.';
    }
  }
</script>

{#if error && !showWelcome && !alreadyCompleted && !surveyFinished}
  <div class="fixed top-2 left-1/2 z-[100] w-full max-w-lg -translate-x-1/2 px-4">
    <div class="flex items-center justify-between gap-3 rounded-lg bg-red-600 px-4 py-3 text-sm text-white shadow-lg">
      <p>{error}</p>
      <button onclick={() => (error = null)} class="shrink-0 font-semibold hover:underline">Dismiss</button>
    </div>
  </div>
{/if}

{#if loading}
  <div class="flex min-h-screen items-center justify-center">
    <p class="text-gray-400">Loading...</p>
  </div>
{:else if error && !showWelcome && !engine.currentQuestion}
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="text-center">
      <p class="text-lg text-red-400">{error}</p>
      <button onclick={() => location.reload()} class="mt-4 text-sm text-gray-400 hover:underline">Try again</button>
    </div>
  </div>
{:else if alreadyCompleted}
  <AlreadyCompleted />
{:else if surveyFinished || engine.isComplete}
  <ThankYouScreen />
{:else if showWelcome}
  <WelcomeScreen onStart={() => (showWelcome = false)} />
{:else}
  <SurveyShell {engine} onAnswer={handleAnswer} onComplete={handleComplete} />
{/if}
