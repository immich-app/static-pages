<script lang="ts">
  import { Button, Input, Textarea } from '@immich/ui';
  import { Icon } from '@immich/ui';
  import {
    mdiPlus,
    mdiContentSave,
    mdiEye,
    mdiPublish,
    mdiPublishOff,
    mdiChevronDown,
    mdiChevronUp,
    mdiAlertCircleOutline,
    mdiCheckCircle,
    mdiClockOutline,
    mdiCircleSmall,
    mdiQrcode,
    mdiContentCopy,
    mdiCodeTags,
  } from '@mdi/js';
  import type { Survey } from '$lib/types';
  import {
    type BuilderSection,
    createDefaultSection,
    duplicateSection,
    moveItem,
    validateSurvey,
    estimateCompletionSeconds,
    formatDuration,
  } from '$lib/engines/builder-engine.svelte';
  import SectionEditor from './SectionEditor.svelte';
  import SlugInput from './SlugInput.svelte';
  import QrCodeModal from './QrCodeModal.svelte';
  import { tick } from 'svelte';

  interface Props {
    survey: Survey;
    sections: BuilderSection[];
    onSaveSurvey: (survey: Partial<Survey>) => Promise<void>;
    onSaveSections: (sections: BuilderSection[]) => Promise<void>;
    onPublish: () => Promise<void>;
    onUnpublish: () => Promise<void>;
    saving?: boolean;
  }

  let { survey, sections, onSaveSurvey, onSaveSections, onPublish, onUnpublish, saving = false }: Props = $props();

  let localTitle = $state(survey.title);
  let localDescription = $state(survey.description ?? '');
  let localSlug = $state(survey.slug ?? '');
  let localWelcomeTitle = $state(survey.welcomeTitle ?? '');
  let localWelcomeDescription = $state(survey.welcomeDescription ?? '');
  let localThankYouTitle = $state(survey.thankYouTitle ?? '');
  let localThankYouDescription = $state(survey.thankYouDescription ?? '');
  let localSections = $derived(sections);
  let error = $state<string | null>(null);
  let success = $state(false);
  let showAdvanced = $state(false);
  let showQrModal = $state(false);
  let embedCopied = $state(false);

  const validationErrors = $derived(validateSurvey(localTitle, localSections));
  const isPublished = $derived(survey.status === 'published');
  const totalQuestions = $derived(localSections.reduce((sum, s) => sum + s.questions.length, 0));
  const estimatedTime = $derived(formatDuration(estimateCompletionSeconds(localSections)));

  function addSection() {
    const newSection = createDefaultSection(localSections.length);
    localSections = [...localSections, newSection];
    tick().then(() => {
      const el = document.querySelector(`[data-section-index="${localSections.length - 1}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function handleDuplicateSection(index: number) {
    const copy = duplicateSection(localSections[index], localSections.length);
    const updated = [...localSections];
    updated.splice(index + 1, 0, copy);
    localSections = updated;
  }

  function updateSection(index: number, section: BuilderSection) {
    const updated = [...localSections];
    updated[index] = section;
    localSections = updated;
  }

  function deleteSection(index: number) {
    localSections = localSections.filter((_, i) => i !== index);
  }

  function moveSection(index: number, direction: 'up' | 'down') {
    localSections = moveItem(localSections, index, direction);
  }

  async function handleSave() {
    error = null;
    success = false;
    try {
      const isNew = !survey.id;
      await onSaveSurvey({
        title: localTitle,
        description: localDescription || null,
        slug: localSlug || null,
        welcomeTitle: localWelcomeTitle || null,
        welcomeDescription: localWelcomeDescription || null,
        thankYouTitle: localThankYouTitle || null,
        thankYouDescription: localThankYouDescription || null,
      } as Partial<Survey>);
      if (!isNew) {
        await onSaveSections(localSections);
      }
      success = true;
      setTimeout(() => {
        success = false;
      }, 2500);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to save';
    }
  }

  async function handlePublish() {
    error = null;
    if (validationErrors.length > 0) {
      error = validationErrors.join('. ');
      return;
    }
    try {
      await handleSave();
      await onPublish();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to publish';
    }
  }

  async function handleUnpublish() {
    error = null;
    try {
      await onUnpublish();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to unpublish';
    }
  }

  const surveyUrl = $derived(survey.slug ? `https://survey.immich.app/s/${survey.slug}` : '');
  const embedCode = $derived(
    survey.slug
      ? `<iframe src="https://survey.immich.app/embed/${survey.slug}" width="100%" height="600" frameborder="0"></iframe>`
      : '',
  );

  async function copyEmbedCode() {
    await navigator.clipboard.writeText(embedCode);
    embedCopied = true;
    setTimeout(() => (embedCopied = false), 2000);
  }
</script>

<!-- Toast notifications -->
{#if error}
  <div
    class="toast-in fixed top-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-lg border border-red-500/20 bg-red-950/90 px-4 py-3 text-sm shadow-xl backdrop-blur-sm"
  >
    <div class="flex items-center gap-2.5 text-red-300">
      <Icon icon={mdiAlertCircleOutline} size="18" class="shrink-0 text-red-400" />
      <p class="flex-1">{error}</p>
      <button onclick={() => (error = null)} class="shrink-0 text-red-400 hover:text-red-200">Dismiss</button>
    </div>
  </div>
{/if}

{#if success}
  <div
    class="toast-in fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-green-500/20 bg-green-950/90 px-4 py-3 text-sm shadow-xl backdrop-blur-sm"
  >
    <div class="flex items-center gap-2 text-green-300">
      <Icon icon={mdiCheckCircle} size="18" class="text-green-400" />
      <span>Changes saved</span>
    </div>
  </div>
{/if}

<!-- Sticky header -->
<div class="bg-light/80 sticky top-0 z-20 border-b border-gray-200 backdrop-blur-md dark:border-gray-800">
  <div class="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
    <div class="flex items-center gap-3">
      <h1 class="text-lg font-semibold tracking-tight">
        {survey.id ? 'Edit Survey' : 'Create Survey'}
      </h1>
      {#if totalQuestions > 0}
        <span class="flex items-center gap-1 text-xs text-gray-500">
          <Icon icon={mdiClockOutline} size="13" />
          {estimatedTime}
          <Icon icon={mdiCircleSmall} size="12" />
          {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
        </span>
      {/if}
    </div>
    <div class="flex items-center gap-2">
      {#if survey.id && survey.slug}
        <a
          href="/s/{survey.slug}"
          target="_blank"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
        >
          <Icon icon={mdiEye} size="16" />
          Preview
        </a>
        {#if isPublished}
          <button
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
            onclick={() => (showQrModal = true)}
          >
            <Icon icon={mdiQrcode} size="16" />
            QR Code
          </button>
        {/if}
      {/if}
      <Button variant="outline" onclick={handleSave} disabled={saving}>
        <Icon icon={mdiContentSave} size="16" />
        {saving ? 'Saving...' : 'Save'}
      </Button>
      {#if isPublished}
        <Button variant="outline" onclick={handleUnpublish} disabled={saving}>
          <Icon icon={mdiPublishOff} size="16" />
          Unpublish
        </Button>
      {:else}
        <Button color="primary" onclick={handlePublish} disabled={saving}>
          <Icon icon={mdiPublish} size="16" />
          Publish
        </Button>
      {/if}
    </div>
  </div>
</div>

<div class="mx-auto max-w-3xl space-y-8 px-6 pt-8 pb-16">
  {#if isPublished}
    <div
      class="animate-in flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400"
    >
      <span class="status-published">Published</span>
      at
      <a
        href="/s/{survey.slug}"
        class="font-mono underline decoration-green-500/30 underline-offset-2 hover:decoration-green-400"
        >/s/{survey.slug}</a
      >
    </div>

    {#if survey.slug}
      <div class="animate-in rounded-xl border border-gray-200 p-5 dark:border-gray-700/80">
        <div class="mb-3 flex items-center gap-2">
          <Icon icon={mdiCodeTags} size="18" class="text-gray-400" />
          <h3 class="text-sm font-semibold">Embed</h3>
        </div>
        <div class="relative">
          <pre
            class="overflow-x-auto rounded-lg bg-gray-100 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"><code
              >{embedCode}</code
            ></pre>
          <button
            class="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-gray-200 px-2 py-1 text-xs font-medium transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            onclick={copyEmbedCode}
          >
            <Icon icon={mdiContentCopy} size="13" />
            {embedCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Survey Details -->
  <div class="animate-in space-y-5 rounded-xl border border-gray-200 p-6 dark:border-gray-700/80">
    <h2 class="text-base font-semibold tracking-tight">Survey Details</h2>

    <div>
      <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Title</label>
      <Input bind:value={localTitle} placeholder="Survey title..." />
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Description</label>
      <Textarea bind:value={localDescription} rows={3} placeholder="What is this survey about?" />
    </div>

    <SlugInput value={localSlug} onChange={(v) => (localSlug = v)} />

    <button
      class="inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-200"
      onclick={() => (showAdvanced = !showAdvanced)}
    >
      <Icon icon={showAdvanced ? mdiChevronUp : mdiChevronDown} size="18" />
      {showAdvanced ? 'Hide' : 'Customize'} welcome & thank you screens
    </button>

    {#if showAdvanced}
      <div class="space-y-4 border-t border-gray-700/60 pt-5">
        <div>
          <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Welcome title</label>
          <Input bind:value={localWelcomeTitle} placeholder="Defaults to survey title" />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase"
            >Welcome description</label
          >
          <Textarea
            bind:value={localWelcomeDescription}
            rows={3}
            placeholder="Introduction text shown before the survey begins..."
          />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Thank you title</label>
          <Input bind:value={localThankYouTitle} placeholder="Defaults to 'Thank you!'" />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase"
            >Thank you message</label
          >
          <Textarea
            bind:value={localThankYouDescription}
            rows={2}
            placeholder="Defaults to 'Your responses have been recorded.'"
          />
        </div>
      </div>
    {/if}
  </div>

  <!-- Sections & Questions -->
  <div class="animate-in animate-in-delay-1 space-y-4">
    <h2 class="text-base font-semibold tracking-tight">Sections & Questions</h2>

    {#each localSections as section, i (section.id)}
      <div data-section-index={i}>
        <SectionEditor
          {section}
          index={i}
          total={localSections.length}
          onChange={(s) => updateSection(i, s)}
          onDelete={() => deleteSection(i)}
          onDuplicate={() => handleDuplicateSection(i)}
          onMove={(dir) => moveSection(i, dir)}
        />
      </div>
    {/each}

    <button
      onclick={addSection}
      class="hover:border-immich-primary hover:bg-immich-primary-5 hover:text-immich-primary flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-600 py-4 text-sm text-gray-400 transition-all"
    >
      <Icon icon={mdiPlus} size="18" />
      Add section
    </button>
  </div>

  <!-- Validation warnings -->
  {#if validationErrors.length > 0}
    <div class="animate-in rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-4 text-sm">
      <div class="flex items-center gap-2 text-yellow-400">
        <Icon icon={mdiAlertCircleOutline} size="18" />
        <p class="font-medium">Issues to fix before publishing</p>
      </div>
      <ul class="mt-2.5 space-y-1 pl-7 text-yellow-400/80">
        {#each validationErrors as err, i (i)}
          <li class="list-disc">{err}</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

{#if showQrModal && surveyUrl}
  <QrCodeModal url={surveyUrl} onClose={() => (showQrModal = false)} />
{/if}
