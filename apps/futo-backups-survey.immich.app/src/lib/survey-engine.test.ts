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

  it('returns false for Q18 when Q17 has an answer', () => {
    const answers: Record<string, SurveyAnswer> = { q17: { value: 'test@example.com' } };
    const q18 = questions[indexOf('q18')];
    expect(shouldShowQuestion(q18, answers)).toBe(false);
  });

  it('returns true for Q18 when Q17 has no answer', () => {
    const answers: Record<string, SurveyAnswer> = {};
    const q18 = questions[indexOf('q18')];
    expect(shouldShowQuestion(q18, answers)).toBe(true);
  });
});

describe('findNextVisibleIndex', () => {
  it('from Q16 skips Q18 when Q17 is answered, lands on Q19', () => {
    const answers: Record<string, SurveyAnswer> = { q17: { value: 'test@example.com' } };
    const q17Index = indexOf('q17');
    // From q17 (answered), next should skip q18 and land on q19
    const result = findNextVisibleIndex(q17Index, questions, answers);
    expect(result).toBe(indexOf('q19'));
  });

  it('from Q16 goes to Q17 normally', () => {
    const answers: Record<string, SurveyAnswer> = {};
    const q16Index = indexOf('q16');
    const result = findNextVisibleIndex(q16Index, questions, answers);
    expect(result).toBe(indexOf('q17'));
  });

  it('past last question returns questions.length (signals completion)', () => {
    const answers: Record<string, SurveyAnswer> = {};
    const lastIndex = questions.length - 1;
    const result = findNextVisibleIndex(lastIndex, questions, answers);
    expect(result).toBe(questions.length);
  });
});

describe('findPrevVisibleIndex', () => {
  it('skips hidden conditional questions going backward', () => {
    const answers: Record<string, SurveyAnswer> = { q17: { value: 'test@example.com' } };
    const q19Index = indexOf('q19');
    // From q19, going back should skip q18 (hidden) and land on q17
    const result = findPrevVisibleIndex(q19Index, questions, answers);
    expect(result).toBe(indexOf('q17'));
  });

  it('at index 0 returns 0', () => {
    const answers: Record<string, SurveyAnswer> = {};
    const result = findPrevVisibleIndex(0, questions, answers);
    expect(result).toBe(0);
  });
});

describe('getVisibleQuestionCount', () => {
  it('excludes hidden conditional questions', () => {
    const answers: Record<string, SurveyAnswer> = { q17: { value: 'test@example.com' } };
    // Q18 should be hidden, so visible count = total - 1
    expect(getVisibleQuestionCount(questions, answers)).toBe(questions.length - 1);
  });

  it('includes all questions when no conditional is triggered', () => {
    const answers: Record<string, SurveyAnswer> = {};
    expect(getVisibleQuestionCount(questions, answers)).toBe(questions.length);
  });
});
