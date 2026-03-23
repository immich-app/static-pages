import { questions } from './survey-definition';
import type { SurveyAnswer, SurveyQuestion } from './types';

/**
 * Pure function: determines if a question should be visible given current answers.
 * Q18 shows only when Q17 is skipped (has no answer).
 */
export function shouldShowQuestion(
  q: SurveyQuestion,
  answers: Record<string, SurveyAnswer>,
): boolean {
  if (!q.conditional) return true;
  if (q.conditional.showIf.condition === 'skipped') {
    return !(q.conditional.showIf.questionId in answers);
  }
  return true;
}

/**
 * Pure function: finds the next visible question index after currentIndex.
 * Returns questions.length if no more visible questions (signals completion).
 */
export function findNextVisibleIndex(
  currentIndex: number,
  qs: SurveyQuestion[],
  answers: Record<string, SurveyAnswer>,
): number {
  let next = currentIndex + 1;
  while (next < qs.length && !shouldShowQuestion(qs[next], answers)) {
    next++;
  }
  return next;
}

/**
 * Pure function: finds the previous visible question index before currentIndex.
 * Returns 0 if already at the beginning.
 */
export function findPrevVisibleIndex(
  currentIndex: number,
  qs: SurveyQuestion[],
  answers: Record<string, SurveyAnswer>,
): number {
  let prev = currentIndex - 1;
  while (prev > 0 && !shouldShowQuestion(qs[prev], answers)) {
    prev--;
  }
  return Math.max(prev, 0);
}

/**
 * Pure function: counts visible questions given current answers.
 */
export function getVisibleQuestionCount(
  qs: SurveyQuestion[],
  answers: Record<string, SurveyAnswer>,
): number {
  return qs.filter((q) => shouldShowQuestion(q, answers)).length;
}

/**
 * Creates a reactive survey engine using Svelte 5 runes.
 * Manages navigation, answers, conditional logic, and completion state.
 */
export function createSurveyEngine(
  initialAnswers: Record<string, SurveyAnswer> = {},
  startIndex = 0,
) {
  let currentIndex = $state(startIndex);
  let answers = $state<Record<string, SurveyAnswer>>({ ...initialAnswers });
  let isComplete = $state(false);

  const currentQuestion = $derived(questions[currentIndex] as SurveyQuestion | undefined);
  const totalVisible = $derived(getVisibleQuestionCount(questions, answers));
  const progress = $derived((Object.keys(answers).length / totalVisible) * 100);

  function next() {
    const nextIdx = findNextVisibleIndex(currentIndex, questions, answers);
    if (nextIdx >= questions.length) {
      isComplete = true;
    } else {
      currentIndex = nextIdx;
    }
  }

  function previous() {
    currentIndex = findPrevVisibleIndex(currentIndex, questions, answers);
  }

  function goTo(questionId: string) {
    const idx = questions.findIndex((q) => q.id === questionId);
    if (idx >= 0) {
      currentIndex = idx;
    }
  }

  function setAnswer(questionId: string, value: string, otherText?: string) {
    answers[questionId] = { value, ...(otherText ? { otherText } : {}) };
  }

  function initialize(resumedAnswers: Record<string, SurveyAnswer>, resumeIndex: number) {
    answers = { ...resumedAnswers };
    currentIndex = resumeIndex;
    isComplete = false;
  }

  return {
    get currentIndex() {
      return currentIndex;
    },
    get currentQuestion() {
      return currentQuestion;
    },
    get answers() {
      return answers;
    },
    get progress() {
      return progress;
    },
    get totalVisible() {
      return totalVisible;
    },
    get isComplete() {
      return isComplete;
    },
    next,
    previous,
    goTo,
    setAnswer,
    initialize,
    shouldShowQuestion: (q: SurveyQuestion) => shouldShowQuestion(q, answers),
  };
}
