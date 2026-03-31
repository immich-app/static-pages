<script lang="ts">
  import { Icon } from '@immich/ui';
  import { Button } from '@immich/ui';
  import { mdiChevronLeft, mdiChevronRight, mdiCheckCircle, mdiClockOutline, mdiDeleteOutline } from '@mdi/js';
  import type { RespondentSummary, RespondentDetail } from '$lib/types';
  import { listRespondents, getRespondent, deleteRespondent } from '$lib/api/surveys';
  import ResponseDetailCard from './ResponseDetail.svelte';

  interface Props {
    surveyId: string;
  }

  let { surveyId }: Props = $props();

  let respondents = $state<RespondentSummary[]>([]);
  let total = $state(0);
  let offset = $state(0);
  let loading = $state(true);
  let selectedDetail = $state<RespondentDetail | null>(null);
  let loadingDetail = $state(false);
  let deletingId = $state<string | null>(null);
  const limit = 20;
  const page = $derived(Math.floor(offset / limit) + 1);
  const totalPages = $derived(Math.ceil(total / limit));

  async function load() {
    loading = true;
    try {
      const data = await listRespondents(surveyId, offset, limit);
      respondents = data.respondents;
      total = data.total;
    } catch {
      // ignore
    }
    loading = false;
  }

  async function viewDetail(respondentId: string) {
    if (selectedDetail?.id === respondentId) {
      selectedDetail = null;
      return;
    }
    loadingDetail = true;
    try {
      selectedDetail = await getRespondent(surveyId, respondentId);
    } catch {
      selectedDetail = null;
    }
    loadingDetail = false;
  }

  async function handleDelete(event: MouseEvent, respondentId: string) {
    event.stopPropagation();
    if (!confirm('Delete this response and all its answers? This cannot be undone.')) return;
    deletingId = respondentId;
    try {
      await deleteRespondent(surveyId, respondentId);
      respondents = respondents.filter((r) => r.id !== respondentId);
      total -= 1;
      if (selectedDetail?.id === respondentId) {
        selectedDetail = null;
      }
      // Reload if we deleted the last item on this page
      if (respondents.length === 0 && offset > 0) {
        offset = Math.max(0, offset - limit);
      }
    } catch {
      // ignore
    }
    deletingId = null;
  }

  $effect(() => {
    void surveyId;
    void offset;
    load();
  });
</script>

<div class="space-y-3">
  {#if loading}
    <p class="py-8 text-center text-sm text-gray-500">Loading responses...</p>
  {:else if respondents.length === 0}
    <p class="py-8 text-center text-sm text-gray-500">No responses yet</p>
  {:else}
    <div class="rounded-xl border border-gray-300 dark:border-gray-600">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:border-gray-700">
            <th class="px-4 py-3">Respondent</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Answers</th>
            <th class="px-4 py-3">Date</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each respondents as r (r.id)}
            <tr
              class="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 {selectedDetail?.id === r.id ? 'bg-gray-50 dark:bg-gray-800/50' : ''}"
              onclick={() => viewDetail(r.id)}
            >
              <td class="px-4 py-3 font-mono text-xs text-gray-400">{r.id.slice(0, 8)}</td>
              <td class="px-4 py-3">
                {#if r.completedAt}
                  <span class="inline-flex items-center gap-1 text-green-400">
                    <Icon icon={mdiCheckCircle} size="14" /> Complete
                  </span>
                {:else}
                  <span class="inline-flex items-center gap-1 text-gray-500">
                    <Icon icon={mdiClockOutline} size="14" /> In progress
                  </span>
                {/if}
              </td>
              <td class="px-4 py-3 text-gray-400">{r.answerCount}</td>
              <td class="px-4 py-3 text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
              <td class="px-4 py-3 text-right">
                <button
                  class="inline-flex items-center rounded-md p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                  onclick={(e) => handleDelete(e, r.id)}
                  disabled={deletingId === r.id}
                  title="Delete response"
                >
                  <Icon icon={mdiDeleteOutline} size="16" />
                </button>
              </td>
            </tr>
            {#if selectedDetail?.id === r.id}
              <tr>
                <td colspan="5" class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  {#if loadingDetail}
                    <p class="py-4 text-center text-sm text-gray-500">Loading...</p>
                  {:else}
                    <ResponseDetailCard detail={selectedDetail} />
                  {/if}
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-500">{total} total responses</span>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="small" disabled={offset === 0} onclick={() => (offset = Math.max(0, offset - limit))}>
            <Icon icon={mdiChevronLeft} size="16" />
          </Button>
          <span class="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <Button variant="outline" size="small" disabled={offset + limit >= total} onclick={() => (offset += limit)}>
            <Icon icon={mdiChevronRight} size="16" />
          </Button>
        </div>
      </div>
    {/if}
  {/if}
</div>
