<script lang="ts">
  /**
   * Shown when a question has too few responses for its chart to be meaningful.
   * The raw responses are still rendered, so no data is lost.
   */
  interface Props {
    count: number;
    threshold: number;
    metricName?: string;
  }

  let { count, threshold, metricName = 'chart' }: Props = $props();
</script>

<div class="rounded-md border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs text-amber-300/90">
  <span class="font-medium">Need {threshold}+ responses</span>
  for a meaningful {metricName}. Showing raw data instead ({count}
  {count === 1 ? 'response' : 'responses'}).
</div>
