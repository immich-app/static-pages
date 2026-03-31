<script lang="ts">
  import type { SurveySection } from '$lib/types';
  import { Button } from '@immich/ui';

  interface Props {
    section: SurveySection;
    sectionIndex: number;
    totalSections: number;
    onContinue: () => void;
    onBack?: () => void;
    canGoBack?: boolean;
  }

  let { section, sectionIndex, totalSections, onContinue, onBack, canGoBack = false }: Props = $props();
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
  <div class="flex max-w-[640px] flex-col gap-4">
    <span class="text-sm font-medium tracking-wider text-gray-400 uppercase">
      Section {sectionIndex + 1} of {totalSections}
    </span>
    <h1 class="text-3xl font-bold">{section.title}</h1>
    {#if section.description}
      <p class="text-base text-gray-500">{section.description}</p>
    {/if}
    <div class="flex items-center gap-3">
      {#if canGoBack && onBack}
        <Button variant="outline" onclick={onBack}>Back</Button>
      {/if}
      <Button color="primary" onclick={onContinue}>Continue</Button>
    </div>
  </div>
</div>
