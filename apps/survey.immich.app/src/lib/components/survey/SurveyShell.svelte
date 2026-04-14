<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { SvelteSet } from 'svelte/reactivity';
  import type { SurveySection } from '$lib/types';
  import type { createSurveyEngine } from '$lib/engines/survey-engine.svelte';
  import QuestionCard from './QuestionCard.svelte';
  import SectionHeader from './SectionHeader.svelte';
  import { announce } from '$lib/stores/announcer.svelte';

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
  let dismissedSections = new SvelteSet<string>();

  // Pre-populate seen sections when resuming mid-survey so we don't
  // re-show section headers the user already passed through. Every
  // section up to and including the current question's section is
  // marked as "seen". On a fresh start (index 0, no answers) this
  // produces an empty set and the first section header shows normally.
  function buildInitialSeenSections(): string[] {
    if (engine.currentIndex === 0 && Object.keys(engine.answers).length === 0) return [];
    const currentQ = engine.currentQuestion;
    if (!currentQ) return [];
    const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const currentSection = sorted.find((s) => s.id === currentQ.section_id);
    if (!currentSection) return [];
    return sorted.filter((s) => s.sortOrder <= currentSection.sortOrder).map((s) => s.id);
  }
  let seenSectionIds = new SvelteSet<string>(buildInitialSeenSections());

  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flyDuration = reducedMotion ? 0 : 300;

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
    const header = currentSectionHeader;
    if (header) {
      dismissedSections.add(header.id);
      seenSectionIds.add(header.id);
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
    } else {
      announce(`Question ${engine.currentIndex + 1} of ${engine.totalQuestions}`);
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

    const backHeader = currentSectionHeader;
    if (showingSectionHeader && backHeader) {
      dismissedSections.delete(backHeader.id);
      seenSectionIds.delete(backHeader.id);
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

    announce(`Question ${engine.currentIndex + 1} of ${engine.totalQuestions}`);
    window.scrollTo(0, 0);
    setTimeout(() => {
      transitioning = false;
    }, 350);
  }
</script>

<div class="relative flex h-full flex-1 flex-col" role="main">
  <div
    class="fixed top-0 left-0 z-50 h-1 w-full bg-gray-700"
    role="progressbar"
    aria-label="Survey progress"
    aria-valuenow={Math.round(engine.progress)}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <div class="bg-immich-primary h-full transition-all duration-300" style="width: {engine.progress}%"></div>
  </div>

  <div class="relative flex flex-1 flex-col overflow-hidden">
    {#key `${engine.currentIndex}-${showingSectionHeader}`}
      <div class="flex flex-1 flex-col" in:fly={{ y: direction * 50, duration: flyDuration, easing: cubicOut }}>
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
          {@const snapshotQuestion = engine.currentQuestion}
          <div class="flex flex-1 flex-col items-center justify-center px-4 pt-6 pb-28 sm:pb-24">
            <QuestionCard
              question={snapshotQuestion}
              answer={engine.answers[snapshotQuestion.id]}
              onAnswer={(value, otherText) => onAnswer(snapshotQuestion.id, value, otherText)}
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
