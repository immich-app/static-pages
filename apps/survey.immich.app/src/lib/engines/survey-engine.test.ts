import { describe, it, expect } from 'vitest';
import type { SurveyQuestion, SurveyAnswer, SurveySection } from '../types';
import {
  shouldShowQuestion,
  findNextVisibleIndex,
  findPrevVisibleIndex,
  getVisibleQuestionCount,
  randomizeQuestions,
  randomizeOptionOrder,
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

describe('randomizeQuestions', () => {
  const sections: SurveySection[] = [
    { id: 's1', title: 'Section 1', sortOrder: 0 },
    { id: 's2', title: 'Section 2', sortOrder: 1 },
  ];

  const multiSectionQuestions: SurveyQuestion[] = [
    makeQuestion({ id: 'a1', section_id: 's1', sortOrder: 0 }),
    makeQuestion({ id: 'a2', section_id: 's1', sortOrder: 1 }),
    makeQuestion({ id: 'a3', section_id: 's1', sortOrder: 2 }),
    makeQuestion({ id: 'a4', section_id: 's1', sortOrder: 3 }),
    makeQuestion({ id: 'b1', section_id: 's2', sortOrder: 0 }),
    makeQuestion({ id: 'b2', section_id: 's2', sortOrder: 1 }),
    makeQuestion({ id: 'b3', section_id: 's2', sortOrder: 2 }),
    makeQuestion({ id: 'b4', section_id: 's2', sortOrder: 3 }),
  ];

  it('same seed produces the same order', () => {
    const result1 = randomizeQuestions(multiSectionQuestions, sections, 'seed-abc');
    const result2 = randomizeQuestions(multiSectionQuestions, sections, 'seed-abc');
    expect(result1.map((q) => q.id)).toEqual(result2.map((q) => q.id));
  });

  it('different seeds produce different orders', () => {
    const result1 = randomizeQuestions(multiSectionQuestions, sections, 'seed-one');
    const result2 = randomizeQuestions(multiSectionQuestions, sections, 'seed-two');
    const ids1 = result1.map((q) => q.id);
    const ids2 = result2.map((q) => q.id);
    // With 8 questions across 2 sections, different seeds should almost certainly differ
    expect(ids1).not.toEqual(ids2);
  });

  it('questions stay within their section after randomization', () => {
    const result = randomizeQuestions(multiSectionQuestions, sections, 'test-seed');
    // First 4 should all be from section s1
    const s1Questions = result.slice(0, 4);
    const s2Questions = result.slice(4, 8);
    for (const q of s1Questions) {
      expect(q.section_id).toBe('s1');
    }
    for (const q of s2Questions) {
      expect(q.section_id).toBe('s2');
    }
  });

  it('preserves all questions (no loss or duplication)', () => {
    const result = randomizeQuestions(multiSectionQuestions, sections, 'preserve-seed');
    const ids = result.map((q) => q.id).sort();
    const originalIds = multiSectionQuestions.map((q) => q.id).sort();
    expect(ids).toEqual(originalIds);
  });

  it('sections are ordered by sortOrder', () => {
    const reversedSections: SurveySection[] = [
      { id: 's2', title: 'Section 2', sortOrder: 1 },
      { id: 's1', title: 'Section 1', sortOrder: 0 },
    ];
    const result = randomizeQuestions(multiSectionQuestions, reversedSections, 'order-seed');
    // Even with reversed section array, s1 (sortOrder 0) should come first
    expect(result[0].section_id).toBe('s1');
    expect(result[4].section_id).toBe('s2');
  });

  it('handles a single section', () => {
    const singleSection: SurveySection[] = [{ id: 's1', title: 'Section 1', sortOrder: 0 }];
    const s1Only = multiSectionQuestions.filter((q) => q.section_id === 's1');
    const result = randomizeQuestions(s1Only, singleSection, 'single-seed');
    expect(result).toHaveLength(4);
    for (const q of result) {
      expect(q.section_id).toBe('s1');
    }
  });

  it('handles empty questions list', () => {
    const result = randomizeQuestions([], sections, 'empty-seed');
    expect(result).toEqual([]);
  });
});

describe('randomizeOptionOrder', () => {
  const questionsWithOptions: SurveyQuestion[] = [
    makeQuestion({
      id: 'opt1',
      options: [
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
        { label: 'C', value: 'C' },
        { label: 'D', value: 'D' },
        { label: 'E', value: 'E' },
      ],
    }),
    makeQuestion({
      id: 'opt2',
      options: [
        { label: 'X', value: 'X' },
        { label: 'Y', value: 'Y' },
        { label: 'Z', value: 'Z' },
        { label: 'W', value: 'W' },
      ],
    }),
    makeQuestion({
      id: 'no-opts',
      type: 'text',
      options: [],
    }),
  ];

  it('same seed produces the same option order', () => {
    const result1 = randomizeOptionOrder(questionsWithOptions, 'opt-seed');
    const result2 = randomizeOptionOrder(questionsWithOptions, 'opt-seed');
    for (let i = 0; i < result1.length; i++) {
      expect(result1[i].options?.map((o) => o.value)).toEqual(result2[i].options?.map((o) => o.value));
    }
  });

  it('different seeds produce different option orders', () => {
    const result1 = randomizeOptionOrder(questionsWithOptions, 'opt-seed-a');
    const result2 = randomizeOptionOrder(questionsWithOptions, 'opt-seed-b');
    // Check at least one question has different option order
    const anyDifferent = result1.some((q, i) => {
      const opts1 = q.options?.map((o) => o.value);
      const opts2 = result2[i].options?.map((o) => o.value);
      return JSON.stringify(opts1) !== JSON.stringify(opts2);
    });
    expect(anyDifferent).toBe(true);
  });

  it('uses per-question seed (different questions shuffled differently)', () => {
    const sameOptions: SurveyQuestion[] = [
      makeQuestion({
        id: 'qa',
        options: [
          { label: '1', value: '1' },
          { label: '2', value: '2' },
          { label: '3', value: '3' },
          { label: '4', value: '4' },
          { label: '5', value: '5' },
        ],
      }),
      makeQuestion({
        id: 'qb',
        options: [
          { label: '1', value: '1' },
          { label: '2', value: '2' },
          { label: '3', value: '3' },
          { label: '4', value: '4' },
          { label: '5', value: '5' },
        ],
      }),
    ];
    const result = randomizeOptionOrder(sameOptions, 'per-q-seed');
    // Different question IDs mean different seeds, so order should differ
    const opts0 = result[0].options?.map((o) => o.value);
    const opts1 = result[1].options?.map((o) => o.value);
    expect(opts0).not.toEqual(opts1);
  });

  it('does not modify questions with no options', () => {
    const result = randomizeOptionOrder(questionsWithOptions, 'no-opt-seed');
    const textQ = result.find((q) => q.id === 'no-opts');
    expect(textQ?.options).toEqual([]);
  });

  it('does not modify questions with a single option', () => {
    const singleOpt: SurveyQuestion[] = [
      makeQuestion({
        id: 'single',
        options: [{ label: 'Only', value: 'Only' }],
      }),
    ];
    const result = randomizeOptionOrder(singleOpt, 'single-seed');
    expect(result[0].options).toEqual([{ label: 'Only', value: 'Only' }]);
  });

  it('preserves all options (no loss or duplication)', () => {
    const result = randomizeOptionOrder(questionsWithOptions, 'preserve-opts');
    const q = result.find((r) => r.id === 'opt1')!;
    const values = q.options!.map((o) => o.value).sort();
    expect(values).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('does not mutate the original questions array', () => {
    const original = questionsWithOptions.map((q) => ({
      ...q,
      options: q.options ? [...q.options] : undefined,
    }));
    randomizeOptionOrder(questionsWithOptions, 'mutate-check');
    for (let i = 0; i < questionsWithOptions.length; i++) {
      expect(questionsWithOptions[i].options).toEqual(original[i].options);
    }
  });
});
