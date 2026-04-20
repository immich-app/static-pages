import type { SurveyAnswer, SurveyQuestion, SurveySection } from '../types';

export function shouldShowQuestion(q: SurveyQuestion, answers: Record<string, SurveyAnswer>): boolean {
  if (!q.conditional) return true;

  const { questionId, condition, value, values } = q.conditional.showIf;
  const answer = answers[questionId];

  switch (condition) {
    case 'skipped':
      return !(questionId in answers);
    case 'equals':
      return answer !== undefined && answer.value === value;
    case 'notEquals':
      return answer !== undefined && answer.value !== value;
    case 'anyOf':
      return answer !== undefined && Array.isArray(values) && values.includes(answer.value);
    default:
      return true;
  }
}

export function findNextVisibleIndex(
  currentIndex: number,
  questions: SurveyQuestion[],
  answers: Record<string, SurveyAnswer>,
): number {
  let next = currentIndex + 1;
  while (next < questions.length && !shouldShowQuestion(questions[next], answers)) {
    next++;
  }
  return next;
}

export function findPrevVisibleIndex(
  currentIndex: number,
  questions: SurveyQuestion[],
  answers: Record<string, SurveyAnswer>,
): number {
  let prev = currentIndex - 1;
  while (prev > 0 && !shouldShowQuestion(questions[prev], answers)) {
    prev--;
  }
  return Math.max(prev, 0);
}

export function getVisibleQuestionCount(questions: SurveyQuestion[], answers: Record<string, SurveyAnswer>): number {
  return questions.filter((q) => shouldShowQuestion(q, answers)).length;
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  for (let i = result.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0;
    const j = Math.abs(hash) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function randomizeQuestions(
  questions: SurveyQuestion[],
  sections: SurveySection[],
  seed: string,
): SurveyQuestion[] {
  const grouped: Record<string, SurveyQuestion[]> = {};
  for (const q of questions) {
    if (!grouped[q.section_id]) grouped[q.section_id] = [];
    grouped[q.section_id].push(q);
  }

  const result: SurveyQuestion[] = [];
  for (const section of [...sections].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const sectionQuestions = grouped[section.id] ?? [];
    result.push(...seededShuffle(sectionQuestions, seed + section.id));
  }
  return result;
}

export function randomizeOptionOrder(questions: SurveyQuestion[], seed: string): SurveyQuestion[] {
  return questions.map((q) => {
    if (!q.options || q.options.length <= 1) return q;
    return { ...q, options: seededShuffle(q.options, seed + q.id) };
  });
}

export function createSurveyEngine(
  surveyQuestions: SurveyQuestion[],
  initialAnswers: Record<string, SurveyAnswer> = {},
  startIndex = 0,
) {
  let currentIndex = $state(startIndex);
  let answers = $state<Record<string, SurveyAnswer>>({ ...initialAnswers });
  let isComplete = $state(false);

  const currentQuestion = $derived(surveyQuestions[currentIndex] as SurveyQuestion | undefined);
  const totalVisible = $derived(getVisibleQuestionCount(surveyQuestions, answers));
  const progress = $derived(totalVisible > 0 ? (Object.keys(answers).length / totalVisible) * 100 : 0);
  const isLastQuestion = $derived(
    findNextVisibleIndex(currentIndex, surveyQuestions, answers) >= surveyQuestions.length,
  );

  function next() {
    const nextIdx = findNextVisibleIndex(currentIndex, surveyQuestions, answers);
    if (nextIdx >= surveyQuestions.length) {
      isComplete = true;
    } else {
      currentIndex = nextIdx;
    }
  }

  function previous() {
    currentIndex = findPrevVisibleIndex(currentIndex, surveyQuestions, answers);
  }

  function goTo(questionId: string) {
    const idx = surveyQuestions.findIndex((q) => q.id === questionId);
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
    get isLastQuestion() {
      return isLastQuestion;
    },
    get totalQuestions() {
      return surveyQuestions.length;
    },
    get questions() {
      return surveyQuestions;
    },
    next,
    previous,
    goTo,
    setAnswer,
    initialize,
    shouldShowQuestion: (q: SurveyQuestion) => shouldShowQuestion(q, answers),
  };
}
