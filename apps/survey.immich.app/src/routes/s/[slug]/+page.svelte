<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import type { Survey, SurveySection, SurveyQuestion } from '$lib/types';
  import { getPublishedSurvey } from '$lib/api/surveys';
  import { createApiClient } from '$lib/api/client';
  import { createSurveyEngine, randomizeQuestions, randomizeOptionOrder } from '$lib/engines/survey-engine.svelte';
  import SurveyShell from '$lib/components/survey/SurveyShell.svelte';
  import WelcomeScreen from '$lib/components/survey/WelcomeScreen.svelte';
  import ThankYouScreen from '$lib/components/survey/ThankYouScreen.svelte';
  import AlreadyCompleted from '$lib/components/survey/AlreadyCompleted.svelte';

  const slug = $derived(page.params.slug!);

  let survey = $state<Survey | null>(null);
  let sections = $state<SurveySection[]>([]);
  let questions = $state<SurveyQuestion[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let showWelcome = $state(false);
  let alreadyCompleted = $state(false);
  let surveyFinished = $state(false);

  let engine: ReturnType<typeof createSurveyEngine> | null = $state(null);
  let client: ReturnType<typeof createApiClient> | null = $state(null);

  onMount(() => {
    (async () => {
      try {
        // Load survey definition
        const data = await getPublishedSurvey(slug);
        survey = data.survey;
        sections = data.sections;
        questions = data.questions;

        // Sort questions by section sort order, then question sort order
        const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
        const sortedQuestions: SurveyQuestion[] = [];
        for (const section of sortedSections) {
          const sectionQuestions = questions
            .filter((q) => q.section_id === section.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          sortedQuestions.push(...sectionQuestions);
        }
        questions = sortedQuestions;

        // Apply randomization if enabled
        if (survey.randomizeQuestions) {
          questions = randomizeQuestions(questions, sections, slug);
        }
        if (survey.randomizeOptions) {
          questions = randomizeOptionOrder(questions, slug);
        }

        // Create engine and client
        engine = createSurveyEngine(questions);
        client = createApiClient(slug);

        client.onSaveError((msg) => {
          error = msg;
        });

        // Resume
        const resume = await client.fetchResume();
        if (resume.isComplete) {
          alreadyCompleted = true;
        } else if (resume.answers && resume.nextQuestionIndex !== undefined && resume.nextQuestionIndex > 0) {
          engine.initialize(resume.answers, resume.nextQuestionIndex);
        } else {
          showWelcome = true;
        }
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load survey';
      }
      loading = false;
    })();

    const handleUnload = () => client?.flushBufferSync();
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      client?.destroy();
    };
  });

  function handleAnswer(questionId: string, value: string, otherText?: string) {
    engine?.setAnswer(questionId, value, otherText);
    client?.bufferAnswer({ questionId, value, otherText });
  }

  async function handleComplete() {
    if (!client) return;
    try {
      const flushed = await client.flushBuffer();
      if (!flushed) {
        error = 'Failed to save your answers. Please try again.';
        return;
      }
      await client.postComplete();
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
{:else if error && !engine?.currentQuestion}
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="text-center">
      <p class="text-lg text-red-400">{error}</p>
    </div>
  </div>
{:else if alreadyCompleted}
  <div class="flex min-h-screen flex-col"><AlreadyCompleted {slug} /></div>
{:else if surveyFinished || engine?.isComplete}
  <div class="flex min-h-screen flex-col"><ThankYouScreen survey={survey ?? undefined} /></div>
{:else if showWelcome && survey}
  <div class="flex min-h-screen flex-col"><WelcomeScreen {survey} {sections} onStart={() => (showWelcome = false)} /></div>
{:else if engine && sections.length > 0}
  <div class="flex min-h-screen flex-col"><SurveyShell {engine} {sections} onAnswer={handleAnswer} onComplete={handleComplete} /></div>
{/if}
