<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import type { Survey, SurveyQuestion } from '$lib/types';
  import { getSurvey, updateSurvey, publishSurvey, unpublishSurvey } from '$lib/api/surveys';
  import { sectionsFromApi, saveSections, type BuilderSection } from '$lib/engines/builder-engine.svelte';
  import SurveyBuilderForm from '$lib/components/builder/SurveyBuilderForm.svelte';

  let survey = $state<Survey | null>(null);
  let sections = $state<BuilderSection[]>([]);
  let allQuestions = $state<SurveyQuestion[]>([]);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);

  const surveyId = $derived(page.params.id!);

  onMount(async () => {
    try {
      const data = await getSurvey(surveyId);
      survey = data.survey;
      allQuestions = data.questions;
      sections = sectionsFromApi(data.sections, data.questions);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load survey';
    }
    loading = false;
  });

  async function handleSaveSurvey(updates: Partial<Survey> & { password?: string | null }) {
    if (!survey) return;
    saving = true;
    try {
      survey = await updateSurvey(survey.id, {
        title: updates.title ?? undefined,
        description: updates.description !== undefined ? updates.description : undefined,
        slug: updates.slug !== undefined ? updates.slug : undefined,
        welcome_title: updates.welcomeTitle !== undefined ? updates.welcomeTitle : undefined,
        welcome_description: updates.welcomeDescription !== undefined ? updates.welcomeDescription : undefined,
        thank_you_title: updates.thankYouTitle !== undefined ? updates.thankYouTitle : undefined,
        thank_you_description: updates.thankYouDescription !== undefined ? updates.thankYouDescription : undefined,
        closes_at: updates.closesAt !== undefined ? updates.closesAt : undefined,
        max_responses: updates.maxResponses !== undefined ? updates.maxResponses : undefined,
        randomize_questions: updates.randomizeQuestions !== undefined ? updates.randomizeQuestions : undefined,
        randomize_options: updates.randomizeOptions !== undefined ? updates.randomizeOptions : undefined,
        password: updates.password,
      });
    } finally {
      saving = false;
    }
  }

  async function handleSaveSections(newSections: BuilderSection[]) {
    if (!survey) return;
    saving = true;
    try {
      await saveSections(survey.id, sections, newSections, allQuestions);

      // Refresh data
      const data = await getSurvey(survey.id);
      survey = data.survey;
      allQuestions = data.questions;
      sections = sectionsFromApi(data.sections, data.questions);
    } finally {
      saving = false;
    }
  }

  async function handlePublish() {
    if (!survey) return;
    survey = await publishSurvey(survey.id);
  }

  async function handleUnpublish() {
    if (!survey) return;
    survey = await unpublishSurvey(survey.id);
  }
</script>

{#if loading}
  <div class="flex min-h-screen items-center justify-center">
    <p class="text-gray-400">Loading...</p>
  </div>
{:else if error}
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <p class="text-lg text-red-400">{error}</p>
      <a href="/" class="mt-4 inline-block text-sm text-gray-400 hover:underline">Back to dashboard</a>
    </div>
  </div>
{:else if survey}
  <div class="mx-auto max-w-3xl px-6 pt-4">
    <a href="/" class="text-sm text-gray-400 hover:text-gray-200 hover:underline">&larr; Back to dashboard</a>
  </div>
  <SurveyBuilderForm
    {survey}
    {sections}
    onSaveSurvey={handleSaveSurvey}
    onSaveSections={handleSaveSections}
    onPublish={handlePublish}
    onUnpublish={handleUnpublish}
    {saving}
  />
{/if}
