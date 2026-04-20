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
    mdiUndo,
    mdiRedo,
  } from '@mdi/js';
  import { dndzone } from 'svelte-dnd-action';
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
  import SurveyPreview from './SurveyPreview.svelte';
  import SharePanel from '$lib/components/sharing/SharePanel.svelte';
  import { tick, onMount, onDestroy } from 'svelte';

  interface Props {
    survey: Survey;
    sections: BuilderSection[];
    onSaveSurvey: (survey: Partial<Survey> & { password?: string | null }) => Promise<void>;
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
  let localClosesAt = $state(survey.closesAt ?? '');
  let localMaxResponses = $state(survey.maxResponses != null ? String(survey.maxResponses) : '');
  let localRandomizeQuestions = $state(survey.randomizeQuestions ?? false);
  let localRandomizeOptions = $state(survey.randomizeOptions ?? false);
  let localPasswordEnabled = $state(survey.hasPassword ?? false);
  let localPassword = $state('');
  let localSections = $state(sections);
  let error = $state<string | null>(null);
  let success = $state(false);
  let showAdvanced = $state(false);
  let showScheduling = $state(false);
  let showQrModal = $state(false);
  let showPreview = $state(false);
  let embedCopied = $state(false);

  // Undo/redo
  interface Snapshot {
    title: string;
    description: string;
    slug: string;
    sections: BuilderSection[];
  }

  let undoStack = $state<Snapshot[]>([]);
  let redoStack = $state<Snapshot[]>([]);
  let snapshotTimer: ReturnType<typeof setTimeout> | undefined;
  // Guard so the "track changes → pushSnapshot" effect doesn't re-push the
  // state that undo/redo just restored, which would otherwise stack a
  // duplicate on top of the action and make the next undo/redo a no-op.
  let isRestoring = false;

  function takeSnapshot(): Snapshot {
    return {
      title: localTitle,
      description: localDescription,
      slug: localSlug,
      sections: JSON.parse(JSON.stringify(localSections)),
    };
  }

  function pushSnapshot() {
    if (isRestoring) return;
    clearTimeout(snapshotTimer);
    snapshotTimer = setTimeout(() => {
      const snap = takeSnapshot();
      undoStack = [...undoStack.slice(-49), snap];
      redoStack = [];
    }, 500);
  }

  function undo() {
    if (undoStack.length === 0) return;
    isRestoring = true;
    const current = takeSnapshot();
    redoStack = [...redoStack, current];
    const snap = undoStack[undoStack.length - 1];
    undoStack = undoStack.slice(0, -1);
    localTitle = snap.title;
    localDescription = snap.description;
    localSlug = snap.slug;
    localSections = snap.sections;
    queueMicrotask(() => {
      isRestoring = false;
    });
  }

  function redo() {
    if (redoStack.length === 0) return;
    isRestoring = true;
    const current = takeSnapshot();
    undoStack = [...undoStack, current];
    const snap = redoStack[redoStack.length - 1];
    redoStack = redoStack.slice(0, -1);
    localTitle = snap.title;
    localDescription = snap.description;
    localSlug = snap.slug;
    localSections = snap.sections;
    queueMicrotask(() => {
      isRestoring = false;
    });
  }

  function handleKeyboard(e: KeyboardEvent) {
    // Don't hijack Ctrl-Z / Ctrl-Y when the user is editing in a native
    // input — let the browser's native per-field undo stack take it.
    const active = document.activeElement;
    if (
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      (active instanceof HTMLElement && active.isContentEditable)
    ) {
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
      e.preventDefault();
      redo();
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeyboard);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeyboard);
    clearTimeout(snapshotTimer);
  });

  // Track changes for undo snapshots
  $effect(() => {
    // Access reactive values to trigger effect
    void localTitle;
    void localDescription;
    void localSlug;
    void localSections;
    pushSnapshot();
  });

  const validationErrors = $derived(validateSurvey(localTitle, localSections));
  const isPublished = $derived(survey.status === 'published');
  const totalQuestions = $derived(localSections.reduce((sum, s) => sum + s.questions.length, 0));
  const estimatedTime = $derived(formatDuration(estimateCompletionSeconds(localSections)));

  // DnD sections need stable IDs
  const dndSections = $derived(
    localSections.map((s, i) => ({
      ...s,
      id: s.id || `new-section-${i}`,
    })),
  );

  function handleSectionDndConsider(e: CustomEvent<{ items: BuilderSection[] }>) {
    localSections = e.detail.items;
  }

  function handleSectionDndFinalize(e: CustomEvent<{ items: BuilderSection[] }>) {
    localSections = e.detail.items.map((s, i) => ({ ...s, sortOrder: i }));
  }

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
      // Strip DnD-generated fake IDs before saving
      const cleanSections = localSections.map((s) => ({
        ...s,
        id: s.id?.startsWith('new-section-') ? '' : s.id,
        questions: s.questions.map((q) => ({
          ...q,
          id: q.id?.startsWith('new-q-') ? '' : q.id,
        })),
      }));
      // For new surveys, sync sections to the parent first so that the create
      // handler can persist them as part of the initial survey-creation pass.
      if (isNew) {
        await onSaveSections(cleanSections);
      }
      await onSaveSurvey({
        title: localTitle,
        description: localDescription || null,
        slug: localSlug || null,
        welcomeTitle: localWelcomeTitle || null,
        welcomeDescription: localWelcomeDescription || null,
        thankYouTitle: localThankYouTitle || null,
        thankYouDescription: localThankYouDescription || null,
        closesAt: localClosesAt || null,
        maxResponses: localMaxResponses ? Number(localMaxResponses) : null,
        randomizeQuestions: localRandomizeQuestions,
        randomizeOptions: localRandomizeOptions,
        ...(localPasswordEnabled && localPassword
          ? { password: localPassword }
          : localPasswordEnabled
            ? {}
            : { password: null }),
      } as Partial<Survey> & { password?: string | null });
      if (!isNew) {
        await onSaveSections(cleanSections);
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
      <button
        class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
        disabled={undoStack.length === 0}
        onclick={undo}
        title="Undo (Ctrl+Z)"
      >
        <Icon icon={mdiUndo} size="18" />
      </button>
      <button
        class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
        disabled={redoStack.length === 0}
        onclick={redo}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Icon icon={mdiRedo} size="18" />
      </button>
      {#if survey.id}
        <button
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          onclick={() => (showPreview = true)}
        >
          <Icon icon={mdiEye} size="16" />
          Preview
        </button>
      {/if}
      {#if survey.id && survey.slug && isPublished}
        <button
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          onclick={() => (showQrModal = true)}
        >
          <Icon icon={mdiQrcode} size="16" />
          QR Code
        </button>
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
      {#if surveyUrl}
        <SharePanel url={surveyUrl} title={survey.title} description={survey.description ?? ''} />
      {/if}
    </div>

    {#if survey.slug}
      <div class="animate-in rounded-xl border border-gray-200 p-5 dark:border-gray-700/80">
        <div class="mb-3 flex items-center gap-2">
          <Icon icon={mdiCodeTags} size="18" class="text-gray-400" />
          <h3 class="text-sm font-semibold">Embed</h3>
        </div>
        <div class="relative">
          <pre
            class="overflow-x-auto rounded-lg bg-gray-100 p-3 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-300"><code
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

    <button
      class="inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-200"
      onclick={() => (showScheduling = !showScheduling)}
    >
      <Icon icon={showScheduling ? mdiChevronUp : mdiChevronDown} size="18" />
      {showScheduling ? 'Hide' : 'Configure'} scheduling & limits
    </button>

    {#if showScheduling}
      <div class="space-y-4 border-t border-gray-700/60 pt-5">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Close date</label>
            <input
              type="datetime-local"
              class="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600"
              value={localClosesAt ? localClosesAt.slice(0, 16) : ''}
              oninput={(e) => {
                const v = (e.target as HTMLInputElement).value;
                localClosesAt = v ? new Date(v).toISOString() : '';
              }}
            />
            <p class="mt-1 text-[11px] text-gray-500">Survey will stop accepting responses after this date</p>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Max responses</label>
            <Input type="number" bind:value={localMaxResponses} placeholder="Unlimited" />
            <p class="mt-1 text-[11px] text-gray-500">Stop accepting responses after this many completions</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-5">
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" bind:checked={localRandomizeQuestions} class="accent-immich-primary" />
            Randomize question order
          </label>
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" bind:checked={localRandomizeOptions} class="accent-immich-primary" />
            Randomize option order
          </label>
        </div>
        <div class="border-t border-gray-700/60 pt-4">
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" bind:checked={localPasswordEnabled} class="accent-immich-primary" />
            Password protect this survey
          </label>
          {#if localPasswordEnabled}
            <div class="mt-3 max-w-xs">
              <Input
                type="password"
                bind:value={localPassword}
                placeholder={survey.hasPassword ? 'Leave blank to keep current password' : 'Set a password'}
              />
              <p class="mt-1 text-[11px] text-gray-500">Respondents must enter this password to access the survey</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Sections & Questions -->
  <div class="animate-in animate-in-delay-1 space-y-4">
    <h2 class="text-base font-semibold tracking-tight">Sections & Questions</h2>

    <div
      use:dndzone={{ items: dndSections, flipDurationMs: 200, dragDisabled: false, type: 'sections' }}
      onconsider={handleSectionDndConsider}
      onfinalize={handleSectionDndFinalize}
      class="space-y-4"
    >
      {#each dndSections as section, i (section.id)}
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
    </div>

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

{#if showPreview}
  <SurveyPreview {survey} sections={localSections} onClose={() => (showPreview = false)} />
{/if}
