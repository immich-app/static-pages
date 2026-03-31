<script lang="ts">
  import { page } from '$app/state';
  import { createSurveyLoader } from '$lib/engines/survey-loader.svelte';
  import SurveyShell from '$lib/components/survey/SurveyShell.svelte';
  import WelcomeScreen from '$lib/components/survey/WelcomeScreen.svelte';
  import ThankYouScreen from '$lib/components/survey/ThankYouScreen.svelte';
  import AlreadyCompleted from '$lib/components/survey/AlreadyCompleted.svelte';
  import PasswordGate from '$lib/components/survey/PasswordGate.svelte';

  const slug = $derived(page.params.slug!);
  const loader = createSurveyLoader(slug);
</script>

<svelte:head>
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</svelte:head>

{#if loader.error && !loader.showWelcome && !loader.alreadyCompleted && !loader.surveyFinished}
  <div class="fixed top-2 left-1/2 z-[100] w-full max-w-lg -translate-x-1/2 px-4">
    <div class="flex items-center justify-between gap-3 rounded-lg bg-red-600 px-4 py-3 text-sm text-white shadow-lg">
      <p>{loader.error}</p>
      <button onclick={() => loader.dismissError()} class="shrink-0 font-semibold hover:underline">Dismiss</button>
    </div>
  </div>
{/if}

{#if loader.loading}
  <div class="flex min-h-screen items-center justify-center">
    <p class="text-gray-400">Loading...</p>
  </div>
{:else if loader.needsPassword}
  <PasswordGate surveyTitle={loader.survey?.title} onSubmit={loader.submitPassword} />
{:else if loader.error && !loader.engine?.currentQuestion}
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="text-center">
      <p class="text-lg text-red-400">{loader.error}</p>
    </div>
  </div>
{:else if loader.alreadyCompleted}
  <div class="flex min-h-screen flex-col"><AlreadyCompleted {slug} /></div>
{:else if loader.surveyFinished || loader.engine?.isComplete}
  <div class="flex min-h-screen flex-col"><ThankYouScreen survey={loader.survey ?? undefined} /></div>
{:else if loader.showWelcome && loader.survey}
  <div class="flex min-h-screen flex-col">
    <WelcomeScreen survey={loader.survey} sections={loader.sections} onStart={() => loader.start()} />
  </div>
{:else if loader.engine && loader.sections.length > 0}
  <div class="flex min-h-screen flex-col">
    <SurveyShell
      engine={loader.engine}
      sections={loader.sections}
      onAnswer={loader.handleAnswer}
      onComplete={loader.handleComplete}
    />
  </div>
{/if}
