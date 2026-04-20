<script lang="ts">
  import { onMount } from 'svelte';
  import { getAuditLog, type AuditEntry } from '$lib/api/audit';

  let entries = $state<AuditEntry[]>([]);
  let total = $state(0);
  let offset = $state(0);
  let loading = $state(true);
  let error = $state<string | null>(null);

  const limit = 50;
  const totalPages = $derived(Math.ceil(total / limit));
  const currentPage = $derived(Math.floor(offset / limit) + 1);

  async function load() {
    loading = true;
    error = null;
    try {
      const data = await getAuditLog(offset, limit);
      entries = data.entries;
      total = data.total;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load audit log';
    }
    loading = false;
  }

  function goToPage(page: number) {
    offset = (page - 1) * limit;
    load();
  }

  onMount(load);
</script>

<div class="mx-auto max-w-5xl px-6 py-10">
  <div class="animate-in mb-8">
    <h1 class="text-3xl font-bold tracking-tight">Audit Log</h1>
    <p class="mt-1 text-sm text-gray-500">Track all administrative actions across the system</p>
  </div>

  {#if error}
    <div class="mb-6 rounded-lg border border-red-500/20 bg-red-950/90 px-4 py-3 text-sm text-red-300">
      {error}
    </div>
  {/if}

  {#if loading}
    <div class="flex flex-col items-center justify-center py-24">
      <div class="border-t-immich-primary h-8 w-8 animate-spin rounded-full border-2 border-gray-600"></div>
      <p class="mt-4 text-sm text-gray-500">Loading audit log...</p>
    </div>
  {:else if entries.length === 0}
    <div class="flex flex-col items-center rounded-2xl border border-dashed border-gray-600 px-8 py-16 text-center">
      <p class="text-lg font-medium text-gray-300">No audit entries</p>
      <p class="mt-1.5 text-sm text-gray-500">Actions will appear here as they occur.</p>
    </div>
  {:else}
    <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700/80">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50 dark:border-gray-700/80 dark:bg-gray-800/50">
            <th class="px-4 py-3 font-medium text-gray-500">Time</th>
            <th class="px-4 py-3 font-medium text-gray-500">User</th>
            <th class="px-4 py-3 font-medium text-gray-500">Action</th>
            <th class="px-4 py-3 font-medium text-gray-500">Resource</th>
            <th class="px-4 py-3 font-medium text-gray-500">Details</th>
          </tr>
        </thead>
        <tbody>
          {#each entries as entry (entry.id)}
            <tr
              class="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/30"
            >
              <td class="px-4 py-3 text-xs whitespace-nowrap text-gray-500">
                {new Date(entry.created_at).toLocaleString()}
              </td>
              <td class="px-4 py-3 text-sm">{entry.user_email}</td>
              <td class="px-4 py-3">
                <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium dark:bg-gray-800">
                  {entry.action}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-400">
                {entry.resource_type}{entry.resource_id ? ` / ${entry.resource_id.slice(0, 8)}...` : ''}
              </td>
              <td class="max-w-xs truncate px-4 py-3 text-xs text-gray-500">{entry.details ?? ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if totalPages > 1}
      <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>{total} total entries</span>
        <div class="flex items-center gap-2">
          <button
            class="rounded-md px-3 py-1.5 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
            disabled={currentPage <= 1}
            onclick={() => goToPage(currentPage - 1)}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            class="rounded-md px-3 py-1.5 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
            disabled={currentPage >= totalPages}
            onclick={() => goToPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>
