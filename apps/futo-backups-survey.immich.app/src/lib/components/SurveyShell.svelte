<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { questions, sections } from '$lib/survey-definition';
  import type { SurveySection } from '$lib/types';
  import type { createSurveyEngine } from '$lib/survey-engine.svelte';
  import { findNextVisibleIndex } from '$lib/survey-engine.svelte';
  import QuestionCard from './QuestionCard.svelte';
  import SectionHeader from './SectionHeader.svelte';

  interface Props {
    engine: ReturnType<typeof createSurveyEngine>;
    onAnswer: (questionId: string, value: string, otherText?: string) => void;
    onComplete: () => void;
  }

  let { engine, onAnswer, onComplete }: Props = $props();

  let direction = $state(1);
  let transitioning = $state(false);
  let dismissedSections = $state<Set<number>>(new Set());

  const needsSectionHeader = $derived.by(() => {
    const q = engine.currentQuestion;
    if (!q) return null;
    return sections.find((s) => s.questionIds[0] === q.id) ?? null;
  });

  const showingSectionHeader = $derived.by(() => {
    const section = needsSectionHeader;
    return !!(section && !dismissedSections.has(section.number));
  });

  const currentSection = $derived.by(() => {
    return showingSectionHeader ? needsSectionHeader : null;
  });

  const isLastQuestion = $derived(
    findNextVisibleIndex(engine.currentIndex, questions, engine.answers) >= questions.length,
  );

  function dismissSection() {
    if (currentSection) {
      dismissedSections.add(currentSection.number);
      // Trigger reactivity by reassigning
      dismissedSections = new Set(dismissedSections);
    }
  }

  function handleAnswer(questionId: string, value: string, otherText?: string) {
    onAnswer(questionId, value, otherText);
  }

  function handleNext() {
    if (transitioning) return;
    transitioning = true;
    direction = 1;
    engine.next();
    if (engine.isComplete) {
      onComplete();
    }
    setTimeout(() => {
      transitioning = false;
    }, 350);
  }

  function handleBack() {
    if (transitioning) return;
    transitioning = true;
    direction = -1;

    if (showingSectionHeader && currentSection) {
      // On a section header — go back to previous section's last question
      dismissedSections.delete(currentSection.number);
      dismissedSections = new Set(dismissedSections);
      engine.previous();
    } else {
      const currentQ = engine.currentQuestion;
      const currentSec = currentQ ? sections.find((s) => s.questionIds.includes(currentQ.id)) : null;

      if (currentSec && currentQ?.id === currentSec.questionIds[0]) {
        // At the first question of a section — re-show this section's header
        dismissedSections.delete(currentSec.number);
        dismissedSections = new Set(dismissedSections);
      } else {
        engine.previous();
      }
    }

    setTimeout(() => {
      transitioning = false;
    }, 350);
  }
</script>

<div class="relative min-h-screen">
  <div class="fixed top-0 left-0 z-50 h-1 w-full bg-gray-700">
    <div
      class="h-full bg-immich-primary transition-all duration-300"
      style="width: {engine.progress}%"
    ></div>
  </div>

  <div class="relative min-h-screen overflow-hidden">
    {#key `${engine.currentIndex}-${showingSectionHeader}`}
      <div
        class="w-full"
        in:fly={{ y: direction * 50, duration: 300, easing: cubicOut }}
        out:fly={{ y: direction * -50, duration: 300, easing: cubicOut }}
      >
        {#if showingSectionHeader && currentSection}
          <SectionHeader
            section={currentSection}
            onContinue={dismissSection}
            onBack={handleBack}
            canGoBack={currentSection.number > 1}
          />
        {:else if engine.currentQuestion}
          <div class="flex min-h-screen flex-col items-center justify-center px-4 pb-24">
            <QuestionCard
              question={engine.currentQuestion}
              answer={engine.answers[engine.currentQuestion.id]}
              onAnswer={(value, otherText) => handleAnswer(engine.currentQuestion!.id, value, otherText)}
              onNext={handleNext}
              onBack={handleBack}
              canGoBack={engine.currentIndex > 0}
              isLast={isLastQuestion}
            />
          </div>
        {/if}
      </div>
    {/key}
  </div>
</div>
