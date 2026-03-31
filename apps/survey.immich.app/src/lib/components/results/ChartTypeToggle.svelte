<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiChartBar, mdiChartDonut } from '@mdi/js';

  interface Props {
    value: 'bar' | 'pie';
    onChange: (type: 'bar' | 'pie') => void;
  }

  let { value, onChange }: Props = $props();
</script>

<div class="flex rounded-md border border-gray-300 dark:border-gray-600">
  <button
    class="rounded-l-md p-1.5 transition-colors {value === 'bar'
      ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
      : 'text-gray-400 hover:text-gray-300'}"
    onclick={() => onChange('bar')}
    title="Bar chart"
  >
    <Icon icon={mdiChartBar} size="14" />
  </button>
  <button
    class="rounded-r-md p-1.5 transition-colors {value === 'pie'
      ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
      : 'text-gray-400 hover:text-gray-300'}"
    onclick={() => onChange('pie')}
    title="Pie chart"
  >
    <Icon icon={mdiChartDonut} size="14" />
  </button>
</div>
