import { describe, it, expect } from 'vitest';
import { questions } from './survey-definition';
import type { SurveyAnswer, SurveyQuestion } from './types';
import {
  shouldShowQuestion,
  findNextVisibleIndex,
  findPrevVisibleIndex,
  getVisibleQuestionCount,
} from './survey-engine.svelte';

// Helper: find index by question id
function indexOf(id: string): number {
  return questions.findIndex((q) => q.id === id);
}

describe('shouldShowQuestion', () => {
  it('returns true for regular questions without conditional', () => {
    const answers: Record<string, SurveyAnswer> = {};
    expect(shouldShowQuestion(questions[0], answers)).toBe(true);
  });
});

describe('findNextVisibleIndex', () => {
  it('from Q12 goes to Q17 normally', () => {
    const answers: Record<string, SurveyAnswer> = {};
    const q12Index = indexOf('q12');
    const result = findNextVisibleIndex(q12Index, questions, answers);
    expect(result).toBe(indexOf('q17'));
  });

  it('from Q17 goes to Q13', () => {
    const answers: Record<string, SurveyAnswer> = {};
    const q17Index = indexOf('q17');
    const result = findNextVisibleIndex(q17Index, questions, answers);
    expect(result).toBe(indexOf('q13'));
  });

  it('past last question returns questions.length (signals completion)', () => {
    const answers: Record<string, SurveyAnswer> = {};
    const lastIndex = questions.length - 1;
    const result = findNextVisibleIndex(lastIndex, questions, answers);
    expect(result).toBe(questions.length);
  });
});

describe('findPrevVisibleIndex', () => {
  it('from Q19 goes back to Q16', () => {
    const answers: Record<string, SurveyAnswer> = {};
    const q19Index = indexOf('q19');
    const result = findPrevVisibleIndex(q19Index, questions, answers);
    expect(result).toBe(indexOf('q16'));
  });

  it('at index 0 returns 0', () => {
    const answers: Record<string, SurveyAnswer> = {};
    const result = findPrevVisibleIndex(0, questions, answers);
    expect(result).toBe(0);
  });
});

describe('getVisibleQuestionCount', () => {
  it('includes all questions when no conditional is triggered', () => {
    const answers: Record<string, SurveyAnswer> = {};
    expect(getVisibleQuestionCount(questions, answers)).toBe(questions.length);
  });
});
