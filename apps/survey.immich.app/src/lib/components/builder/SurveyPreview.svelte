<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiClose, mdiCellphone } from '@mdi/js';
  import type { Survey } from '$lib/types';
  import type { BuilderSection } from '$lib/engines/builder-engine.svelte';
  import { createSurveyEngine } from '$lib/engines/survey-engine.svelte';
  import WelcomeScreen from '$lib/components/survey/WelcomeScreen.svelte';
  import SurveyShell from '$lib/components/survey/SurveyShell.svelte';
  import ThankYouScreen from '$lib/components/survey/ThankYouScreen.svelte';

  interface Props {
    survey: Survey;
    sections: BuilderSection[];
    onClose: () => void;
  }

  let { survey, sections, onClose }: Props = $props();

  let phase = $state<'welcome' | 'survey' | 'thanks'>('welcome');

  const previewQuestions = $derived(
    sections.flatMap((s) =>
      s.questions.map((q, i) => ({
        id: q.id || `preview-${s.id || s.sortOrder}-${i}`,
        section_id: s.id || `section-${s.sortOrder}`,
        text: q.text || 'Untitled question',
        description: q.description || undefined,
        type: q.type,
        options: q.options,
        hasOther: q.hasOther,
        otherPrompt: q.otherPrompt || undefined,
        maxLength: q.maxLength ?? undefined,
        placeholder: q.placeholder || undefined,
        required: q.required,
        sortOrder: q.sortOrder,
        config: q.config as Record<string, unknown> | undefined,
      })),
    ),
  );

  const previewSections = $derived(
    sections.map((s, i) => ({
      id: s.id || `section-${i}`,
      title: s.title || `Section ${i + 1}`,
      description: s.description || undefined,
      sortOrder: s.sortOrder,
    })),
  );

  const engine = $derived(createSurveyEngine(previewQuestions));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
  onkeydown={(e) => e.key === 'Escape' && onClose()}
>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="absolute inset-0" onclick={onClose}></div>

  <div class="relative z-10 flex flex-col items-center gap-4">
    <div class="flex items-center gap-3">
      <Icon icon={mdiCellphone} size="20" class="text-gray-400" />
      <span class="text-sm font-medium text-gray-300">Preview</span>
      <button
        class="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
        onclick={onClose}
      >
        <Icon icon={mdiClose} size="20" />
      </button>
    </div>

    <div
      class="relative h-[667px] w-[375px] overflow-hidden rounded-[2.5rem] border-4 border-gray-600 bg-gray-950 shadow-2xl [transform:translateZ(0)]"
    >
      <div class="h-full overflow-y-auto">
        {#if phase === 'welcome'}
          <WelcomeScreen
            {survey}
            sections={previewSections}
            onStart={() => (phase = 'survey')}
          />
        {:else if phase === 'survey'}
          <SurveyShell
            {engine}
            sections={previewSections}
            onAnswer={(questionId, value, otherText) => engine.setAnswer(questionId, value, otherText)}
            onComplete={() => (phase = 'thanks')}
          />
        {:else}
          <ThankYouScreen {survey} />
        {/if}
      </div>
    </div>
  </div>
</div>
