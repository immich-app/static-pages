<script lang="ts">
  import { Button } from '@immich/ui';
  import { Icon } from '@immich/ui';
  import {
    mdiPencil,
    mdiChartBar,
    mdiDelete,
    mdiOpenInNew,
    mdiArchiveOutline,
    mdiArchiveArrowUpOutline,
    mdiExport,
  } from '@mdi/js';
  import type { Survey } from '$lib/types';

  interface Props {
    survey: Survey;
    onDelete: (id: string) => void;
    onArchive?: (id: string) => void;
    onUnarchive?: (id: string) => void;
    onExport?: (id: string) => void;
  }

  let { survey, onDelete, onArchive, onUnarchive, onExport }: Props = $props();

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-600 text-gray-200',
    published: 'bg-green-600 text-green-100',
    closed: 'bg-red-600 text-red-100',
  };

  const formattedDate = $derived(
    new Date(survey.updatedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  );
</script>

<div
  class="rounded-xl border border-gray-300 p-5 transition-colors hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500 {survey.archivedAt ? 'opacity-60' : ''}"
>
  <div class="mb-3 flex items-start justify-between">
    <div>
      <h3 class="text-lg font-semibold">{survey.title}</h3>
      {#if survey.description}
        <p class="mt-1 line-clamp-2 text-sm text-gray-500">{survey.description}</p>
      {/if}
    </div>
    <div class="flex shrink-0 items-center gap-2">
      {#if survey.archivedAt}
        <span class="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
          Archived
        </span>
      {/if}
      <span
        class="rounded-full px-3 py-1 text-xs font-medium {statusColors[survey.status] ?? statusColors.draft}"
      >
        {survey.status}
      </span>
    </div>
  </div>

  <div class="mb-4 flex items-center gap-4 text-sm text-gray-400">
    <span>Updated {formattedDate}</span>
    {#if survey.slug}
      <span>/s/{survey.slug}</span>
    {/if}
  </div>

  <div class="flex items-center gap-2">
    <a href="/edit/{survey.id}">
      <Button variant="outline" size="small">
        <Icon icon={mdiPencil} size="14" />
        Edit
      </Button>
    </a>
    <a href="/results/{survey.id}">
      <Button variant="outline" size="small">
        <Icon icon={mdiChartBar} size="14" />
        Results
      </Button>
    </a>
    {#if survey.status === 'published' && survey.slug}
      <a href="/s/{survey.slug}" target="_blank">
        <Button variant="outline" size="small">
          <Icon icon={mdiOpenInNew} size="14" />
          View
        </Button>
      </a>
    {/if}
    {#if onExport}
      <button class="p-1 text-gray-400 hover:text-gray-200" onclick={() => onExport?.(survey.id)} title="Export definition">
        <Icon icon={mdiExport} size="16" />
      </button>
    {/if}
    {#if survey.archivedAt && onUnarchive}
      <button class="p-1 text-amber-400 hover:text-amber-300" onclick={() => onUnarchive?.(survey.id)} title="Unarchive">
        <Icon icon={mdiArchiveArrowUpOutline} size="16" />
      </button>
    {:else if onArchive}
      <button class="p-1 text-gray-400 hover:text-amber-400" onclick={() => onArchive?.(survey.id)} title="Archive">
        <Icon icon={mdiArchiveOutline} size="16" />
      </button>
    {/if}
    <button class="ml-auto p-1 text-gray-400 hover:text-red-400" onclick={() => onDelete(survey.id)}>
      <Icon icon={mdiDelete} size="16" />
    </button>
  </div>
</div>
