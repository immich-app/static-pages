import { describe, it, expect } from 'vitest';
import type { SurveyQuestion, SurveyAnswer } from '../types';
import {
  shouldShowQuestion,
  findNextVisibleIndex,
  findPrevVisibleIndex,
  getVisibleQuestionCount,
} from './survey-engine.svelte';

function makeQuestion(overrides: Partial<SurveyQuestion> & { id: string }): SurveyQuestion {
  return {
    section_id: 's1',
    text: `Question ${overrides.id}`,
    type: 'radio',
    required: true,
    sortOrder: 0,
    ...overrides,
  };
}

const questions: SurveyQuestion[] = [
  makeQuestion({ id: 'q1', sortOrder: 0 }),
  makeQuestion({ id: 'q2', sortOrder: 1 }),
  makeQuestion({
    id: 'q3',
    sortOrder: 2,
    conditional: { showIf: { questionId: 'q2', condition: 'skipped' } },
  }),
  makeQuestion({ id: 'q4', sortOrder: 3 }),
];

describe('shouldShowQuestion', () => {
  it('shows unconditional questions', () => {
    expect(shouldShowQuestion(questions[0], {})).toBe(true);
  });

  it('shows conditional question when dependency is skipped', () => {
    expect(shouldShowQuestion(questions[2], {})).toBe(true);
  });

  it('hides conditional question when dependency is answered', () => {
    expect(shouldShowQuestion(questions[2], { q2: { value: 'yes' } })).toBe(false);
  });

  it('shows question with equals condition when answer matches', () => {
    const q = makeQuestion({
      id: 'q5',
      conditional: { showIf: { questionId: 'q1', condition: 'equals', value: 'yes' } },
    });
    expect(shouldShowQuestion(q, { q1: { value: 'yes' } })).toBe(true);
  });

  it('hides question with equals condition when answer does not match', () => {
    const q = makeQuestion({
      id: 'q5',
      conditional: { showIf: { questionId: 'q1', condition: 'equals', value: 'yes' } },
    });
    expect(shouldShowQuestion(q, { q1: { value: 'no' } })).toBe(false);
  });

  it('hides question with equals condition when question is unanswered', () => {
    const q = makeQuestion({
      id: 'q5',
      conditional: { showIf: { questionId: 'q1', condition: 'equals', value: 'yes' } },
    });
    expect(shouldShowQuestion(q, {})).toBe(false);
  });

  it('shows question with notEquals condition when answer differs', () => {
    const q = makeQuestion({
      id: 'q5',
      conditional: { showIf: { questionId: 'q1', condition: 'notEquals', value: 'yes' } },
    });
    expect(shouldShowQuestion(q, { q1: { value: 'no' } })).toBe(true);
  });

  it('hides question with notEquals condition when answer matches', () => {
    const q = makeQuestion({
      id: 'q5',
      conditional: { showIf: { questionId: 'q1', condition: 'notEquals', value: 'yes' } },
    });
    expect(shouldShowQuestion(q, { q1: { value: 'yes' } })).toBe(false);
  });

  it('shows question with anyOf condition when answer is in list', () => {
    const q = makeQuestion({
      id: 'q5',
      conditional: { showIf: { questionId: 'q1', condition: 'anyOf', values: ['a', 'b', 'c'] } },
    });
    expect(shouldShowQuestion(q, { q1: { value: 'b' } })).toBe(true);
  });

  it('hides question with anyOf condition when answer is not in list', () => {
    const q = makeQuestion({
      id: 'q5',
      conditional: { showIf: { questionId: 'q1', condition: 'anyOf', values: ['a', 'b', 'c'] } },
    });
    expect(shouldShowQuestion(q, { q1: { value: 'd' } })).toBe(false);
  });
});

describe('findNextVisibleIndex', () => {
  it('returns next index when no conditionals apply', () => {
    expect(findNextVisibleIndex(0, questions, {})).toBe(1);
  });

  it('skips hidden conditional questions', () => {
    const answers: Record<string, SurveyAnswer> = { q2: { value: 'yes' } };
    expect(findNextVisibleIndex(1, questions, answers)).toBe(3);
  });

  it('returns questions.length when at end', () => {
    expect(findNextVisibleIndex(3, questions, {})).toBe(4);
  });
});

describe('findPrevVisibleIndex', () => {
  it('returns previous index', () => {
    expect(findPrevVisibleIndex(1, questions, {})).toBe(0);
  });

  it('skips hidden conditional questions going backward', () => {
    const answers: Record<string, SurveyAnswer> = { q2: { value: 'yes' } };
    expect(findPrevVisibleIndex(3, questions, answers)).toBe(1);
  });

  it('returns 0 when at start', () => {
    expect(findPrevVisibleIndex(0, questions, {})).toBe(0);
  });
});

describe('getVisibleQuestionCount', () => {
  it('counts all when no conditionals hidden', () => {
    expect(getVisibleQuestionCount(questions, {})).toBe(4);
  });

  it('excludes hidden conditional questions', () => {
    const answers: Record<string, SurveyAnswer> = { q2: { value: 'yes' } };
    expect(getVisibleQuestionCount(questions, answers)).toBe(3);
  });
});
