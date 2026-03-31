<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import type { Survey, SurveyQuestion } from '$lib/types';
  import {
    getSurvey,
    updateSurvey,
    createSection as apiCreateSection,
    updateSection as apiUpdateSection,
    deleteSection as apiDeleteSection,
    createQuestion as apiCreateQuestion,
    updateQuestion as apiUpdateQuestion,
    deleteQuestion as apiDeleteQuestion,
    reorderSections as apiReorderSections,
    reorderQuestions as apiReorderQuestions,
    publishSurvey,
    unpublishSurvey,
  } from '$lib/api/surveys';
  import { sectionsFromApi, type BuilderSection } from '$lib/engines/builder-engine.svelte';
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

  async function handleSaveSurvey(updates: Partial<Survey>) {
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
      });
    } finally {
      saving = false;
    }
  }

  async function handleSaveSections(newSections: BuilderSection[]) {
    if (!survey) return;
    saving = true;
    try {
      const newSectionIds = new Set(newSections.filter((s) => s.id).map((s) => s.id));

      // 1. Delete removed sections
      for (const s of sections) {
        if (s.id && !newSectionIds.has(s.id)) {
          await apiDeleteSection(s.id);
        }
      }

      // 2. Create new sections and update existing ones
      for (const section of newSections) {
        if (!section.id) {
          const created = await apiCreateSection(survey.id, {
            title: section.title,
            description: section.description ?? undefined,
          });
          section.id = created.id;
        } else {
          await apiUpdateSection(section.id, {
            title: section.title,
            description: section.description ?? undefined,
          });
        }
      }

      // 3. Reorder sections (now all have IDs)
      if (newSections.length > 0) {
        await apiReorderSections(
          survey.id,
          newSections.map((s, idx) => ({ id: s.id, sort_order: idx })),
        );
      }

      // 4. Handle questions for each section
      for (const section of newSections) {
        const sectionId = section.id;
        const existingQuestionIds = new Set(allQuestions.filter((q) => q.section_id === sectionId).map((q) => q.id));
        const newQuestionIds = new Set(section.questions.filter((q) => q.id).map((q) => q.id));

        // Delete removed questions
        for (const qId of existingQuestionIds) {
          if (!newQuestionIds.has(qId)) {
            await apiDeleteQuestion(qId);
          }
        }

        // Create/update questions
        for (const q of section.questions) {
          if (!q.id) {
            const created = await apiCreateQuestion(sectionId, {
              text: q.text,
              description: q.description || undefined,
              type: q.type,
              options: ['radio', 'checkbox'].includes(q.type) ? q.options : undefined,
              required: q.required,
              has_other: q.hasOther,
              other_prompt: q.otherPrompt || undefined,
              max_length: q.maxLength ?? undefined,
              placeholder: q.placeholder || undefined,
            });
            q.id = created.id;
          } else {
            await apiUpdateQuestion(q.id, {
              section_id: sectionId,
              text: q.text,
              description: q.description || undefined,
              type: q.type,
              options: ['radio', 'checkbox'].includes(q.type) ? q.options : undefined,
              required: q.required,
              has_other: q.hasOther,
              other_prompt: q.otherPrompt || undefined,
              max_length: q.maxLength ?? undefined,
              placeholder: q.placeholder || undefined,
            });
          }
        }

        // Reorder questions in this section
        if (section.questions.length > 0) {
          await apiReorderQuestions(
            sectionId,
            section.questions.map((q, idx) => ({ id: q.id, sort_order: idx })),
          );
        }
      }

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
