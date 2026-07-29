<script lang="ts">
  import type { createSurveyLoader } from '$lib/engines/survey-loader.svelte';
  import SurveyShell from './SurveyShell.svelte';
  import WelcomeScreen from './WelcomeScreen.svelte';
  import ThankYouScreen from './ThankYouScreen.svelte';
  import AlreadyCompleted from './AlreadyCompleted.svelte';
  import PasswordGate from './PasswordGate.svelte';

  interface Props {
    slug: string;
    loader: ReturnType<typeof createSurveyLoader>;
    embedded?: boolean;
    showReloadOnError?: boolean;
  }

  let { slug, loader, embedded = false, showReloadOnError = true }: Props = $props();
</script>

{#if loader.error && loader.engine?.currentQuestion}
  <div class="fixed top-2 left-1/2 z-[100] w-full max-w-lg -translate-x-1/2 px-4">
    <div class="flex items-center justify-between gap-3 rounded-lg bg-red-600 px-4 py-3 text-sm text-white shadow-lg">
      <p>{loader.error}</p>
      <button onclick={() => loader.dismissError()} class="shrink-0 font-semibold hover:underline">Dismiss</button>
    </div>
  </div>
{/if}

{#if loader.loading}
  <div class="flex min-h-screen flex-col items-center justify-center gap-3">
    {#if embedded}
      <p class="text-gray-400">Loading...</p>
    {:else}
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-400"></div>
      <p class="text-sm text-gray-400">Loading survey...</p>
    {/if}
  </div>
{:else if loader.needsPassword}
  <PasswordGate surveyTitle={loader.survey?.title} onSubmit={loader.submitPassword} />
{:else if loader.error && !loader.engine?.currentQuestion}
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="text-center">
      <p class="text-lg text-red-400">{loader.error}</p>
      {#if showReloadOnError}
        <button class="mt-4 text-sm text-gray-400 hover:underline" onclick={() => window.location.reload()}>
          Try again
        </button>
      {/if}
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
{:else}
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="text-center">
      <p class="text-gray-400">Something went wrong loading this survey.</p>
      {#if showReloadOnError}
        <button class="mt-4 text-sm text-blue-400 hover:underline" onclick={() => window.location.reload()}>
          Try again
        </button>
      {/if}
    </div>
  </div>
{/if}
