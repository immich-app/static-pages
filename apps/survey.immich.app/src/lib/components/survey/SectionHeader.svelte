<script lang="ts">
  import type { SurveySection } from '$lib/types';
  import { Button } from '@immich/ui';

  interface Props {
    section: SurveySection;
    sectionIndex: number;
    totalSections: number;
    questionCount?: number;
    onContinue: () => void;
    onBack?: () => void;
    canGoBack?: boolean;
  }

  let {
    section,
    sectionIndex,
    totalSections,
    questionCount,
    onContinue,
    onBack,
    canGoBack = false,
  }: Props = $props();
</script>

<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
  <div
    class="bg-immich-bg-subtle/40 dark:bg-immich-dark-bg/40 flex w-full max-w-[640px] flex-col gap-5 rounded-2xl border border-gray-200 p-8 shadow-sm dark:border-gray-800"
  >
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs font-semibold tracking-wider text-gray-500 uppercase">
        Section {sectionIndex + 1} of {totalSections}
      </span>
      <div class="flex items-center gap-1.5" aria-hidden="true">
        {#each { length: totalSections } as _, i (i)}
          <span
            class="h-1.5 w-6 rounded-full {i <= sectionIndex ? 'bg-immich-primary' : 'bg-gray-300 dark:bg-gray-700'}"
          ></span>
        {/each}
      </div>
    </div>

    <h1 class="text-3xl font-bold">{section.title}</h1>

    {#if section.description}
      <p class="text-base text-gray-500 dark:text-gray-400">{section.description}</p>
    {/if}

    {#if questionCount !== undefined && questionCount > 0}
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {questionCount}
        {questionCount === 1 ? 'question' : 'questions'} in this section
      </p>
    {/if}

    <div class="mt-2 flex items-center gap-3">
      {#if canGoBack && onBack}
        <Button variant="outline" onclick={onBack}>Back</Button>
      {/if}
      <Button color="primary" onclick={onContinue}>Continue</Button>
    </div>
  </div>
</div>
