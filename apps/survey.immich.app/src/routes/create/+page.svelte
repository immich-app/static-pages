<script lang="ts">
  import { goto } from '$app/navigation';
  import { Icon } from '@immich/ui';
  import { mdiPlus, mdiFileDocumentOutline } from '@mdi/js';
  import type { Survey } from '$lib/types';
  import { createSurvey, updateSurvey, publishSurvey, unpublishSurvey } from '$lib/api/surveys';
  import type { BuilderSection } from '$lib/engines/builder-engine.svelte';
  import { surveyTemplates, type SurveyTemplate } from '$lib/engines/survey-templates';
  import SurveyBuilderForm from '$lib/components/builder/SurveyBuilderForm.svelte';

  let showBuilder = $state(false);
  let survey = $state<Survey>({
    id: '',
    title: '',
    description: null,
    slug: null,
    status: 'draft',
    welcomeTitle: null,
    welcomeDescription: null,
    thankYouTitle: null,
    thankYouDescription: null,
    closesAt: null,
    maxResponses: null,
    randomizeQuestions: false,
    randomizeOptions: false,
    createdAt: '',
    updatedAt: '',
  });
  let sections = $state<BuilderSection[]>([]);
  let saving = $state(false);

  function startBlank() {
    showBuilder = true;
  }

  function startFromTemplate(template: SurveyTemplate) {
    survey = {
      ...survey,
      title: template.name,
      description: template.description,
    };
    sections = template.sections.map((s) => ({
      ...s,
      id: '',
      questions: s.questions.map((q) => ({ ...q })),
    }));
    showBuilder = true;
  }

  async function handleSaveSurvey(updates: Partial<Survey>) {
    saving = true;
    try {
      if (!survey.id) {
        const created = await createSurvey({
          title: updates.title || 'Untitled Survey',
          description: updates.description ?? undefined,
        });
        goto(`/edit/${created.id}`, { replaceState: true });
        return;
      }
      survey = await updateSurvey(survey.id, {
        title: updates.title ?? undefined,
        description: updates.description ?? undefined,
        slug: updates.slug ?? undefined,
        welcome_title: updates.welcomeTitle ?? undefined,
        welcome_description: updates.welcomeDescription ?? undefined,
        thank_you_title: updates.thankYouTitle ?? undefined,
        thank_you_description: updates.thankYouDescription ?? undefined,
        closes_at: updates.closesAt ?? undefined,
        max_responses: updates.maxResponses ?? undefined,
        randomize_questions: updates.randomizeQuestions ?? undefined,
        randomize_options: updates.randomizeOptions ?? undefined,
      });
    } finally {
      saving = false;
    }
  }

  async function handleSaveSections(_newSections: BuilderSection[]) {
    sections = _newSections;
  }

  async function handlePublish() {
    if (survey.id) {
      survey = await publishSurvey(survey.id);
    }
  }

  async function handleUnpublish() {
    if (survey.id) {
      survey = await unpublishSurvey(survey.id);
    }
  }
</script>

<div class="mx-auto max-w-3xl px-6 pt-4">
  <a href="/" class="text-sm text-gray-400 hover:text-gray-200 hover:underline">&larr; Back to dashboard</a>
</div>

{#if showBuilder}
  <SurveyBuilderForm
    {survey}
    {sections}
    onSaveSurvey={handleSaveSurvey}
    onSaveSections={handleSaveSections}
    onPublish={handlePublish}
    onUnpublish={handleUnpublish}
    {saving}
  />
{:else}
  <div class="mx-auto max-w-3xl px-6 pt-8 pb-16">
    <h1 class="mb-2 text-2xl font-bold tracking-tight">Create a Survey</h1>
    <p class="mb-8 text-gray-400">Start from scratch or pick a template.</p>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button
        class="hover:border-immich-primary hover:bg-immich-primary-5 group flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-600 px-6 py-8 text-center transition-all"
        onclick={startBlank}
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors group-hover:bg-immich-primary-10 group-hover:text-immich-primary"
        >
          <Icon icon={mdiPlus} size="24" />
        </div>
        <div>
          <p class="font-semibold">Blank Survey</p>
          <p class="mt-1 text-sm text-gray-500">Start from scratch</p>
        </div>
      </button>

      {#each surveyTemplates as template (template.id)}
        <button
          class="group flex flex-col items-center gap-3 rounded-xl border border-gray-600 px-6 py-8 text-center transition-all hover:border-gray-400 hover:bg-gray-800/50"
          onclick={() => startFromTemplate(template)}
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors group-hover:text-gray-200"
          >
            <Icon icon={mdiFileDocumentOutline} size="24" />
          </div>
          <div>
            <p class="font-semibold">{template.name}</p>
            <p class="mt-1 text-sm text-gray-500">{template.description}</p>
          </div>
        </button>
      {/each}
    </div>
  </div>
{/if}
