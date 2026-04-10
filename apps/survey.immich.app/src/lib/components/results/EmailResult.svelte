<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiContentCopy, mdiCheck, mdiEmailMultipleOutline } from '@mdi/js';
  import { computeEmailSummary, type AnswerData, type EmailEntry, type EmailKind } from './analytics-utils';
  import StatStrip from './StatStrip.svelte';

  interface Props {
    answers: AnswerData[];
  }

  let { answers }: Props = $props();

  type FilterKind = 'all' | EmailKind | 'role';

  const MAILTO_BCC_LIMIT = 50;
  const PAGE_SIZE = 25;

  const summary = $derived(computeEmailSummary(answers));

  let filter = $state<FilterKind>('all');
  let search = $state('');
  let page = $state(0);
  let copied = $state<'list' | 'mailto' | null>(null);

  const filteredEntries = $derived.by<EmailEntry[]>(() => {
    const q = search.trim().toLowerCase();
    return summary.entries.filter((e) => {
      if (filter === 'corporate' && e.kind !== 'corporate') return false;
      if (filter === 'free' && e.kind !== 'free') return false;
      if (filter === 'disposable' && e.kind !== 'disposable') return false;
      if (filter === 'role' && !e.isRoleBased) return false;
      if (q && !e.normalized.includes(q) && !e.raw.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  const totalPages = $derived(Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE)));
  const visibleEntries = $derived(filteredEntries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE));

  // Reset paging when filters change.
  $effect(() => {
    void filter;
    void search;
    page = 0;
  });

  interface StatEntry {
    label: string;
    value: string;
    tone?: 'default' | 'positive' | 'negative' | 'warning';
    hint?: string;
  }

  const stats = $derived.by<StatEntry[]>(() => {
    const out: StatEntry[] = [
      { label: 'Responses', value: String(summary.total) },
      {
        label: 'Unique',
        value: String(summary.unique),
        tone: 'positive',
        hint: 'Deduped (gmail dots/+tags normalised)',
      },
    ];
    if (summary.duplicates > 0) {
      out.push({
        label: 'Duplicates',
        value: String(summary.duplicates),
        tone: 'warning',
      });
    }
    if (summary.disposableCount > 0) {
      out.push({
        label: 'Disposable',
        value: String(summary.disposableCount),
        tone: 'negative',
        hint: 'Known throwaway providers (mailinator, tempmail, etc.)',
      });
    }
    if (summary.roleBasedCount > 0) {
      out.push({
        label: 'Role-based',
        value: String(summary.roleBasedCount),
        tone: 'warning',
        hint: 'admin@, info@, support@, etc. — probably not a real lead',
      });
    }
    if (summary.invalidCount > 0) {
      out.push({
        label: 'Invalid',
        value: String(summary.invalidCount),
        tone: 'negative',
      });
    }
    return out;
  });

  const qualityTotal = $derived(summary.corporateCount + summary.freeCount + summary.disposableCount);
  const corporatePct = $derived(qualityTotal > 0 ? (summary.corporateCount / qualityTotal) * 100 : 0);
  const freePct = $derived(qualityTotal > 0 ? (summary.freeCount / qualityTotal) * 100 : 0);
  const disposablePct = $derived(qualityTotal > 0 ? (summary.disposableCount / qualityTotal) * 100 : 0);

  const maxDomainCount = $derived(Math.max(1, ...summary.topDomains.map((d) => d.count)));

  function domainColor(kind: EmailKind): string {
    if (kind === 'corporate') return 'bg-emerald-500/70';
    if (kind === 'free') return 'bg-blue-500/70';
    return 'bg-red-500/70';
  }

  function filterCount(kind: FilterKind): number {
    if (kind === 'all') return summary.unique;
    if (kind === 'corporate') return summary.entries.filter((e) => e.kind === 'corporate').length;
    if (kind === 'free') return summary.entries.filter((e) => e.kind === 'free').length;
    if (kind === 'disposable') return summary.entries.filter((e) => e.kind === 'disposable').length;
    return summary.entries.filter((e) => e.isRoleBased).length;
  }

  async function copyToClipboard(text: string, which: 'list' | 'mailto') {
    try {
      await navigator.clipboard.writeText(text);
      copied = which;
      setTimeout(() => {
        if (copied === which) copied = null;
      }, 1500);
    } catch {
      // ignore clipboard errors — user can select manually
    }
  }

  async function copyFilteredList() {
    const list = filteredEntries.map((e) => e.normalized).join('\n');
    await copyToClipboard(list, 'list');
  }

  const mailtoHref = $derived.by(() => {
    const bcc = filteredEntries
      .slice(0, MAILTO_BCC_LIMIT)
      .map((e) => e.normalized)
      .join(',');
    return `mailto:?bcc=${encodeURIComponent(bcc)}`;
  });

  const mailtoTruncated = $derived(filteredEntries.length > MAILTO_BCC_LIMIT);

  const filters: Array<{ key: FilterKind; label: string; tone: string }> = [
    { key: 'all', label: 'All', tone: 'default' },
    { key: 'corporate', label: 'Corporate', tone: 'emerald' },
    { key: 'free', label: 'Free providers', tone: 'blue' },
    { key: 'disposable', label: 'Disposable', tone: 'red' },
    { key: 'role', label: 'Role-based', tone: 'amber' },
  ];

  function filterChipClass(key: FilterKind): string {
    const active = filter === key;
    if (!active) return 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-300 dark:border-gray-700';
    // Tone-coloured when active
    switch (key) {
      case 'corporate':
        return 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400';
      case 'free':
        return 'border-blue-500/60 bg-blue-500/10 text-blue-400';
      case 'disposable':
        return 'border-red-500/60 bg-red-500/10 text-red-400';
      case 'role':
        return 'border-amber-500/60 bg-amber-500/10 text-amber-400';
      default:
        return 'border-gray-500 bg-gray-500/10 text-gray-200';
    }
  }
</script>

<div class="space-y-5">
  <StatStrip {stats} />

  {#if qualityTotal > 0}
    <!-- Quality split: corporate vs free vs disposable -->
    <div>
      <div
        class="mb-1.5 flex items-center justify-between text-[10px] font-medium tracking-wider text-gray-500 uppercase"
      >
        <span>Lead quality</span>
        <span class="font-normal tracking-normal text-gray-500 normal-case">
          {Math.round(corporatePct)}% corporate · {Math.round(freePct)}% free · {Math.round(disposablePct)}% disposable
        </span>
      </div>
      <div class="flex h-2 overflow-hidden rounded-full bg-gray-800">
        {#if corporatePct > 0}
          <div
            class="h-full bg-emerald-500/80"
            style="width: {corporatePct}%"
            title="Corporate: {summary.corporateCount}"
          ></div>
        {/if}
        {#if freePct > 0}
          <div
            class="h-full bg-blue-500/80"
            style="width: {freePct}%"
            title="Free providers: {summary.freeCount}"
          ></div>
        {/if}
        {#if disposablePct > 0}
          <div
            class="h-full bg-red-500/80"
            style="width: {disposablePct}%"
            title="Disposable: {summary.disposableCount}"
          ></div>
        {/if}
      </div>
    </div>
  {/if}

  {#if summary.topDomains.length > 0}
    <!-- Top domains -->
    <div>
      <div class="mb-2 text-[10px] font-medium tracking-wider text-gray-500 uppercase">Top domains</div>
      <div class="space-y-1.5">
        {#each summary.topDomains as d (d.domain)}
          <div class="flex items-center gap-3">
            <span class="w-36 shrink-0 truncate text-xs text-gray-300">{d.domain}</span>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
              <div class="h-full {domainColor(d.kind)}" style="width: {(d.count / maxDomainCount) * 100}%"></div>
            </div>
            <span class="w-10 shrink-0 text-right text-xs text-gray-400 tabular-nums">{d.count}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if summary.entries.length > 0}
    <!-- Filter + search + actions -->
    <div class="space-y-2">
      <div class="flex flex-wrap items-center gap-1.5">
        {#each filters as f (f.key)}
          {@const count = filterCount(f.key)}
          {#if f.key === 'all' || count > 0}
            <button
              type="button"
              class="rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors {filterChipClass(
                f.key,
              )}"
              onclick={() => (filter = f.key)}
            >
              {f.label}
              <span class="ml-1 tabular-nums opacity-70">{count}</span>
            </button>
          {/if}
        {/each}
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <input
          type="search"
          bind:value={search}
          placeholder="Filter emails…"
          class="min-w-0 flex-1 rounded-md border border-gray-300 bg-transparent px-2 py-1 text-xs text-gray-700 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:text-gray-200"
        />
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[11px] text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-500 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
          disabled={filteredEntries.length === 0}
          onclick={copyFilteredList}
          title="Copy the filtered list to the clipboard, one email per line"
        >
          <Icon icon={copied === 'list' ? mdiCheck : mdiContentCopy} size="12" />
          {copied === 'list' ? 'Copied' : 'Copy list'}
        </button>
        <a
          class="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[11px] text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-500 aria-disabled:pointer-events-none aria-disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
          href={mailtoHref}
          aria-disabled={filteredEntries.length === 0}
          title={mailtoTruncated
            ? `Opens a new mail with the first ${MAILTO_BCC_LIMIT} emails in BCC (filtered set has ${filteredEntries.length})`
            : 'Opens a new mail with the filtered set in BCC'}
        >
          <Icon icon={mdiEmailMultipleOutline} size="12" />
          mailto:BCC
        </a>
      </div>
    </div>

    <!-- Email list -->
    <div class="space-y-1">
      {#each visibleEntries as e (e.normalized)}
        <div class="flex items-center gap-2 rounded-md bg-gray-100/60 px-3 py-1.5 text-sm dark:bg-gray-800/60">
          <a
            href="mailto:{e.normalized}"
            class="min-w-0 flex-1 truncate font-mono text-xs text-gray-700 hover:text-blue-500 dark:text-gray-200"
            title={e.normalized}
          >
            {e.normalized}
          </a>
          {#if e.count > 1}
            <span
              class="shrink-0 rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-300 tabular-nums"
              title="Submitted by {e.count} respondents"
            >
              ×{e.count}
            </span>
          {/if}
          {#if e.kind === 'disposable'}
            <span class="shrink-0 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400"
              >disposable</span
            >
          {:else if e.kind === 'free'}
            <span class="shrink-0 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400"
              >free</span
            >
          {/if}
          {#if e.isRoleBased}
            <span class="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400"
              >role</span
            >
          {/if}
        </div>
      {/each}
      {#if visibleEntries.length === 0}
        <p class="py-3 text-center text-xs text-gray-500">No emails match the current filter.</p>
      {/if}
    </div>

    {#if totalPages > 1}
      <div class="flex items-center justify-between text-[11px] text-gray-500">
        <span>
          Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredEntries.length)}
          of {filteredEntries.length}
        </span>
        <div class="flex gap-1">
          <button
            type="button"
            class="rounded-md border border-gray-300 px-2 py-0.5 disabled:opacity-40 dark:border-gray-700"
            disabled={page === 0}
            onclick={() => (page = Math.max(0, page - 1))}
            aria-label="Previous page"
          >
            ← Prev
          </button>
          <button
            type="button"
            class="rounded-md border border-gray-300 px-2 py-0.5 disabled:opacity-40 dark:border-gray-700"
            disabled={page >= totalPages - 1}
            onclick={() => (page = Math.min(totalPages - 1, page + 1))}
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      </div>
    {/if}
  {:else}
    <p class="text-sm text-gray-500">No email responses yet.</p>
  {/if}
</div>
