<script lang="ts">
  import type { RespondentDetail } from '$lib/types';

  interface Props {
    detail: RespondentDetail;
    /** When provided, the matching answer gets highlighted and scrolled into view. */
    highlightQuestionId?: string | null;
  }

  let { detail, highlightQuestionId = null }: Props = $props();
</script>

<div class="space-y-2">
  <div class="mb-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
    <span class="font-mono text-gray-600">{detail.id.slice(0, 8)}</span>
    <span>Started: {new Date(detail.createdAt).toLocaleString()}</span>
    {#if detail.completedAt}
      <span>Completed: {new Date(detail.completedAt).toLocaleString()}</span>
    {/if}
  </div>
  {#each detail.answers as answer (answer.questionId)}
    {@const isMatch = highlightQuestionId === answer.questionId}
    <div
      class="rounded-lg p-3 transition-colors {isMatch
        ? 'bg-yellow-400/10 ring-1 ring-yellow-400/50 dark:bg-yellow-300/10'
        : 'bg-gray-100 dark:bg-gray-800'}"
    >
      <p class="mb-1 flex items-center gap-2 text-xs font-medium text-gray-500">
        <span>{answer.questionText}</span>
        {#if isMatch}
          <span
            class="rounded-full bg-yellow-400/20 px-1.5 py-0.5 text-[10px] font-medium text-yellow-600 dark:text-yellow-300"
          >
            match
          </span>
        {/if}
      </p>
      <p class="text-sm whitespace-pre-wrap">
        {answer.value}{answer.otherText ? ` — ${answer.otherText}` : ''}
      </p>
    </div>
  {/each}
  {#if detail.answers.length === 0}
    <p class="text-sm text-gray-500 italic">No answers recorded</p>
  {/if}
</div>
