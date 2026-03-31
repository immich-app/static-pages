<script lang="ts">
  import { Button, Logo } from '@immich/ui';
  import type { Survey, SurveySection } from '$lib/types';

  interface Props {
    survey: Survey;
    sections: SurveySection[];
    onStart: () => void;
  }

  let { survey, sections, onStart }: Props = $props();

  const sortedSections = $derived([...sections].sort((a, b) => a.sortOrder - b.sortOrder));
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
  <div class="animate-in">
    <Logo variant="stacked" size="giant" />
  </div>

  <div class="animate-in animate-in-delay-1 flex max-w-[640px] flex-col gap-5 text-base">
    <h1 class="text-4xl font-bold tracking-tight">{survey.welcomeTitle ?? survey.title}</h1>

    {#if survey.welcomeDescription}
      <p class="text-lg leading-relaxed text-gray-300">{survey.welcomeDescription}</p>
    {:else if survey.description}
      <p class="text-lg leading-relaxed text-gray-300">{survey.description}</p>
    {/if}

    {#if sortedSections.length > 1}
      <div class="mt-2 rounded-xl border border-gray-700/60 bg-white/[0.02] p-5">
        <p class="mb-3 text-sm font-medium tracking-wider text-gray-500 uppercase">
          {sortedSections.length} sections
        </p>
        <ol class="space-y-2 text-gray-300">
          {#each sortedSections as section, i (section.id)}
            <li class="flex items-baseline gap-3">
              <span
                class="bg-immich-primary-10 text-immich-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium"
              >
                {i + 1}
              </span>
              <span>{section.title}</span>
            </li>
          {/each}
        </ol>
      </div>
    {/if}
  </div>

  <div class="animate-in animate-in-delay-2">
    <Button color="primary" onclick={onStart}>Get Started</Button>
  </div>
</div>
