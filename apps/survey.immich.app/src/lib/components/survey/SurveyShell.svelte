<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { SvelteSet } from 'svelte/reactivity';
  import type { SurveySection } from '$lib/types';
  import type { createSurveyEngine } from '$lib/engines/survey-engine.svelte';
  import QuestionCard from './QuestionCard.svelte';
  import SectionHeader from './SectionHeader.svelte';

  let {
    engine,
    sections,
    onAnswer,
    onComplete,
  }: {
    engine: ReturnType<typeof createSurveyEngine>;
    sections: SurveySection[];
    onAnswer: (questionId: string, value: string, otherText?: string) => void;
    onComplete: () => void;
  } = $props();

  let direction = $state(1);
  let transitioning = $state(false);
  let seenSectionIds = new SvelteSet<string>();
  let dismissedSections = new SvelteSet<string>();

  const sortedSections = $derived([...sections].sort((a, b) => a.sortOrder - b.sortOrder));

  const currentSectionHeader = $derived.by(() => {
    const q = engine.currentQuestion;
    if (!q) return null;
    const section = sortedSections.find((s) => s.id === q.section_id);
    if (!section) return null;
    if (seenSectionIds.has(section.id) || dismissedSections.has(section.id)) return null;
    return section;
  });

  const showingSectionHeader = $derived(!!currentSectionHeader);

  function dismissSection() {
    if (currentSectionHeader) {
      dismissedSections.add(currentSectionHeader.id);
      seenSectionIds.add(currentSectionHeader.id);
    }
    window.scrollTo(0, 0);
  }

  function handleNext() {
    if (transitioning) return;
    transitioning = true;
    direction = 1;

    const q = engine.currentQuestion;
    if (q) {
      const section = sortedSections.find((s) => s.id === q.section_id);
      if (section) {
        seenSectionIds.add(section.id);
      }
    }

    engine.next();
    if (engine.isComplete) {
      onComplete();
    }
    window.scrollTo(0, 0);
    setTimeout(() => {
      transitioning = false;
    }, 350);
  }

  function handleBack() {
    if (transitioning) return;
    transitioning = true;
    direction = -1;

    if (showingSectionHeader && currentSectionHeader) {
      dismissedSections.delete(currentSectionHeader.id);
      seenSectionIds.delete(currentSectionHeader.id);
      engine.previous();
    } else {
      const currentQ = engine.currentQuestion;
      if (currentQ) {
        const section = sortedSections.find((s) => s.id === currentQ.section_id);
        if (section) {
          seenSectionIds.delete(section.id);
        }
      }
      engine.previous();
    }

    window.scrollTo(0, 0);
    setTimeout(() => {
      transitioning = false;
    }, 350);
  }
</script>

<div class="relative min-h-screen">
  <div class="fixed top-0 left-0 z-50 h-1 w-full bg-gray-700">
    <div class="bg-immich-primary h-full transition-all duration-300" style="width: {engine.progress}%"></div>
  </div>

  <div class="relative min-h-screen overflow-hidden">
    {#key `${engine.currentIndex}-${showingSectionHeader}`}
      <div
        class="w-full"
        in:fly={{ y: direction * 50, duration: 300, easing: cubicOut }}
        out:fly={{ y: direction * -50, duration: 300, easing: cubicOut }}
      >
        {#if showingSectionHeader && currentSectionHeader}
          <SectionHeader
            section={currentSectionHeader}
            sectionIndex={sortedSections.indexOf(currentSectionHeader)}
            totalSections={sortedSections.length}
            onContinue={dismissSection}
            onBack={handleBack}
            canGoBack={engine.currentIndex > 0}
          />
        {:else if engine.currentQuestion}
          <div class="flex min-h-screen flex-col items-center justify-center px-4 pb-24">
            <QuestionCard
              question={engine.currentQuestion}
              answer={engine.answers[engine.currentQuestion.id]}
              onAnswer={(value, otherText) => onAnswer(engine.currentQuestion!.id, value, otherText)}
              onNext={handleNext}
              onBack={handleBack}
              canGoBack={engine.currentIndex > 0}
              isLast={engine.isLastQuestion}
            />
          </div>
        {/if}
      </div>
    {/key}
  </div>
</div>
