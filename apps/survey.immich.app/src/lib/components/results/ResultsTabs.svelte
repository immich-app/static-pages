<script lang="ts">
  interface Props {
    active: 'overview' | 'responses' | 'search';
    onChange: (tab: 'overview' | 'responses' | 'search') => void;
  }

  let { active, onChange }: Props = $props();

  const tabs: { id: 'overview' | 'responses' | 'search'; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'responses', label: 'Responses' },
    { id: 'search', label: 'Search' },
  ];
</script>

<div class="flex gap-1 rounded-lg border border-gray-300 p-1 dark:border-gray-600">
  {#each tabs as tab (tab.id)}
    <button
      class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors {active === tab.id
        ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
        : 'text-gray-500 hover:text-gray-300'}"
      onclick={() => onChange(tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</div>
