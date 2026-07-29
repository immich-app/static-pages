<script lang="ts">
  import { Icon } from '@immich/ui';
  import {
    mdiPlus,
    mdiPencilOutline,
    mdiChartBar,
    mdiOpenInNew,
    mdiDeleteOutline,
    mdiContentCopy,
    mdiArchiveOutline,
    mdiArchiveArrowUpOutline,
    mdiExport,
    mdiImport,
    mdiArchive,
  } from '@mdi/js';
  import { mdiMagnify, mdiChevronLeft, mdiChevronRight } from '@mdi/js';
  import type { Survey } from '$lib/types';
  import {
    listSurveysPaginated,
    deleteSurvey,
    duplicateSurvey,
    archiveSurvey,
    unarchiveSurvey,
    exportSurveyDefinition,
    importSurveyDefinition,
  } from '$lib/api/surveys';
  import ImportSurveyModal from '$lib/components/dashboard/ImportSurveyModal.svelte';

  const PAGE_SIZE = 12;

  let surveys = $state<Survey[]>([]);
  let totalSurveys = $state(0);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let showArchived = $state(false);
  let showImportModal = $state(false);
  let search = $state('');
  let page = $state(0);
  let searchTimer: ReturnType<typeof setTimeout> | undefined;

  const totalPages = $derived(Math.max(1, Math.ceil(totalSurveys / PAGE_SIZE)));

  async function loadSurveys() {
    loading = true;
    try {
      const result = await listSurveysPaginated({
        includeArchived: showArchived,
        search: search.trim() || undefined,
        offset: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      surveys = result.surveys;
      totalSurveys = result.total;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load surveys';
    }
    loading = false;
  }

  $effect(() => {
    void showArchived;
    void page;
    loadSurveys();
  });

  function handleSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      page = 0;
      loadSurveys();
    }, 300);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this survey? This cannot be undone.')) return;
    try {
      await deleteSurvey(id);
      await loadSurveys();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete survey';
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await duplicateSurvey(id);
      page = 0;
      await loadSurveys();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to duplicate survey';
    }
  }

  async function handleArchive(id: string) {
    try {
      await archiveSurvey(id);
      await loadSurveys();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to archive survey';
    }
  }

  async function handleUnarchive(id: string) {
    try {
      await unarchiveSurvey(id);
      await loadSurveys();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to unarchive survey';
    }
  }

  async function handleExport(id: string) {
    try {
      const def = await exportSurveyDefinition(id);
      const json = JSON.stringify(def, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const survey = surveys.find((s) => s.id === id);
      a.download = `${survey?.slug ?? survey?.title.toLowerCase().replace(/\s+/g, '-') ?? id}-definition.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to export survey';
    }
  }

  async function handleImport(definition: unknown) {
    try {
      await importSurveyDefinition(definition);
      showImportModal = false;
      page = 0;
      await loadSurveys();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to import survey';
    }
  }
</script>

<div class="mx-auto max-w-3xl px-6 py-10">
  <div class="animate-in mb-10 flex items-end justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Surveys</h1>
      <p class="mt-1 text-sm text-gray-500">Create, manage, and analyze your surveys</p>
    </div>
    <div class="flex items-center gap-2">
      <button
        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
        onclick={() => (showImportModal = true)}
      >
        <Icon icon={mdiImport} size="18" />
        Import
      </button>
      <a
        href="/create"
        class="bg-immich-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 active:scale-[0.98]"
      >
        <Icon icon={mdiPlus} size="18" />
        New Survey
      </a>
    </div>
  </div>

  {#if error}
    <div
      class="toast-in fixed top-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-lg border border-red-500/20 bg-red-950/90 px-4 py-3 text-sm text-red-300 shadow-xl backdrop-blur-sm"
    >
      <div class="flex items-center justify-between gap-3">
        <p>{error}</p>
        <button onclick={() => (error = null)} class="shrink-0 text-red-400 hover:text-red-200">Dismiss</button>
      </div>
    </div>
  {/if}

  <div class="mb-4 flex flex-wrap items-center gap-3">
    <div class="relative min-w-0 flex-1">
      <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
        <Icon icon={mdiMagnify} size="16" />
      </span>
      <input
        type="search"
        bind:value={search}
        oninput={handleSearch}
        placeholder="Search surveys..."
        class="w-full rounded-lg border border-gray-300 bg-transparent py-2 pr-3 pl-9 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none dark:border-gray-700"
      />
    </div>
    <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-400">
      <input type="checkbox" bind:checked={showArchived} class="rounded" />
      <Icon icon={mdiArchive} size="16" />
      Show archived
    </label>
  </div>

  {#if loading}
    <div class="animate-in flex flex-col items-center justify-center py-24">
      <div class="border-t-immich-primary h-8 w-8 animate-spin rounded-full border-2 border-gray-600"></div>
      <p class="mt-4 text-sm text-gray-500">Loading surveys...</p>
    </div>
  {:else if surveys.length === 0}
    <div
      class="animate-in animate-in-delay-1 flex flex-col items-center rounded-2xl border border-dashed border-gray-600 px-8 py-16 text-center"
    >
      {#if search.trim()}
        <Icon icon={mdiMagnify} size="28" class="mb-3 text-gray-500" />
        <p class="text-lg font-medium text-gray-300">No matching surveys</p>
        <p class="mt-1 text-sm text-gray-500">No surveys match "{search.trim()}".</p>
        <button
          class="mt-4 text-sm text-blue-400 hover:underline"
          onclick={() => {
            search = '';
            page = 0;
            loadSurveys();
          }}
        >
          Clear search
        </button>
      {:else}
        <div class="bg-immich-primary-10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Icon icon={mdiPlus} size="28" class="text-immich-primary" />
        </div>
        <p class="text-lg font-medium text-gray-300">No surveys yet</p>
        <p class="mt-1.5 max-w-xs text-sm text-gray-500">Create your first survey to start collecting responses.</p>
        <a
          href="/create"
          class="bg-immich-primary mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-md hover:brightness-110"
        >
          Create Survey
        </a>
      {/if}
    </div>
  {:else}
    <div class="space-y-3">
      {#each surveys as survey, i (survey.id)}
        <div
          class="card-hover animate-in rounded-xl border border-gray-200 bg-white/[0.02] p-5 dark:border-gray-700/80 {survey.archivedAt
            ? 'opacity-60'
            : ''}"
          style="animation-delay: {60 + i * 50}ms"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-3">
                <h3 class="truncate text-base font-semibold">{survey.title}</h3>
                <span
                  class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wider uppercase
                  {survey.status === 'published'
                    ? 'status-published bg-green-500/10 text-green-400'
                    : survey.status === 'closed'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-gray-500/10 text-gray-400'}"
                >
                  {survey.status}
                </span>
                {#if survey.archivedAt}
                  <span
                    class="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium tracking-wider text-amber-400 uppercase"
                  >
                    Archived
                  </span>
                {/if}
              </div>
              {#if survey.description}
                <p class="mt-1 truncate text-sm text-gray-500">{survey.description}</p>
              {/if}
              <div class="mt-2.5 flex items-center gap-3 text-xs text-gray-500">
                <span
                  >Updated {new Date(survey.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}</span
                >
                {#if survey.slug}
                  <span class="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-gray-400">/s/{survey.slug}</span>
                {/if}
              </div>
            </div>
          </div>

          <div class="mt-4 flex items-center gap-1 border-t border-gray-200 pt-3.5 dark:border-gray-700/60">
            <a
              href="/edit/{survey.id}"
              class="text-immich-primary hover:bg-immich-primary-10 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors"
            >
              <Icon icon={mdiPencilOutline} size="15" />
              Edit
            </a>
            <a
              href="/results/{survey.id}"
              class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-200 dark:hover:bg-gray-800"
            >
              <Icon icon={mdiChartBar} size="15" />
              Results
            </a>
            {#if survey.status === 'published' && survey.slug}
              <a
                href="/s/{survey.slug}"
                target="_blank"
                class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-200 dark:hover:bg-gray-800"
              >
                <Icon icon={mdiOpenInNew} size="15" />
                View
              </a>
            {/if}
            <button
              class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-200 dark:hover:bg-gray-800"
              onclick={() => handleDuplicate(survey.id)}
            >
              <Icon icon={mdiContentCopy} size="15" />
              Duplicate
            </button>
            <button
              class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-200 dark:hover:bg-gray-800"
              onclick={() => handleExport(survey.id)}
            >
              <Icon icon={mdiExport} size="15" />
              Export
            </button>
            {#if survey.archivedAt}
              <button
                class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-amber-400 transition-colors hover:bg-amber-500/10"
                onclick={() => handleUnarchive(survey.id)}
              >
                <Icon icon={mdiArchiveArrowUpOutline} size="15" />
                Unarchive
              </button>
            {:else}
              <button
                class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-200 dark:hover:bg-gray-800"
                onclick={() => handleArchive(survey.id)}
              >
                <Icon icon={mdiArchiveOutline} size="15" />
                Archive
              </button>
            {/if}
            <button
              class="ml-auto inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
              onclick={() => handleDelete(survey.id)}
            >
              <Icon icon={mdiDeleteOutline} size="15" />
            </button>
          </div>
        </div>
      {/each}
    </div>

    {#if totalPages > 1}
      <div class="mt-6 flex items-center justify-between text-sm text-gray-400">
        <span>
          {totalSurveys}
          {totalSurveys === 1 ? 'survey' : 'surveys'}
        </span>
        <div class="flex items-center gap-2">
          <button
            class="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
            disabled={page === 0}
            onclick={() => (page = Math.max(0, page - 1))}
          >
            <Icon icon={mdiChevronLeft} size="16" />
            Prev
          </button>
          <span class="text-xs text-gray-500 tabular-nums">Page {page + 1} of {totalPages}</span>
          <button
            class="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
            disabled={page >= totalPages - 1}
            onclick={() => (page = Math.min(totalPages - 1, page + 1))}
          >
            Next
            <Icon icon={mdiChevronRight} size="16" />
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

{#if showImportModal}
  <ImportSurveyModal onImport={handleImport} onClose={() => (showImportModal = false)} />
{/if}
