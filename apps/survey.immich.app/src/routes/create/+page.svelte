<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Survey } from '$lib/types';
  import { createSurvey, updateSurvey, publishSurvey, unpublishSurvey } from '$lib/api/surveys';
  import type { BuilderSection } from '$lib/engines/builder-engine.svelte';
  import SurveyBuilderForm from '$lib/components/builder/SurveyBuilderForm.svelte';

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
    createdAt: '',
    updatedAt: '',
  });
  let sections = $state<BuilderSection[]>([]);
  let saving = $state(false);

  async function handleSaveSurvey(updates: Partial<Survey>) {
    saving = true;
    try {
      if (!survey.id) {
        const created = await createSurvey({
          title: updates.title || 'Untitled Survey',
          description: updates.description ?? undefined,
        });
        // Redirect to the edit page
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
<SurveyBuilderForm
  {survey}
  {sections}
  onSaveSurvey={handleSaveSurvey}
  onSaveSections={handleSaveSections}
  onPublish={handlePublish}
  onUnpublish={handleUnpublish}
  {saving}
/>
