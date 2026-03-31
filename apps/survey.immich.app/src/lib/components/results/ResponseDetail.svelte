<script lang="ts">
  import type { RespondentDetail } from '$lib/types';

  interface Props {
    detail: RespondentDetail;
  }

  let { detail }: Props = $props();
</script>

<div class="space-y-2">
  <div class="mb-3 flex items-center gap-3 text-xs text-gray-500">
    <span>Started: {new Date(detail.createdAt).toLocaleString()}</span>
    {#if detail.completedAt}
      <span>Completed: {new Date(detail.completedAt).toLocaleString()}</span>
    {/if}
  </div>
  {#each detail.answers as answer (answer.questionId)}
    <div class="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
      <p class="mb-1 text-xs font-medium text-gray-500">{answer.questionText}</p>
      <p class="text-sm">{answer.value}{answer.otherText ? ` — ${answer.otherText}` : ''}</p>
    </div>
  {/each}
  {#if detail.answers.length === 0}
    <p class="text-sm text-gray-500 italic">No answers recorded</p>
  {/if}
</div>
