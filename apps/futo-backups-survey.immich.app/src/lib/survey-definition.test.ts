import { expect, test, describe } from 'vitest';
import { questions, sections } from './survey-definition';

describe('survey-definition', () => {
  test('has exactly 18 questions', () => {
    expect(questions).toHaveLength(18);
  });

  test('questions have expected ids in order', () => {
    const ids = questions.map((q) => q.id);
    const expected = [
      ...Array.from({ length: 12 }, (_, i) => `q${i + 1}`),
      'q17',
      'q13', 'q14', 'q15', 'q16',
      'q19',
    ];
    expect(ids).toEqual(expected);
  });

  test('has exactly 6 sections', () => {
    expect(sections).toHaveLength(6);
  });

  test('section 1 contains q1-q6', () => {
    expect(sections[0].questionIds).toEqual(['q1', 'q2', 'q3', 'q4', 'q5', 'q6']);
  });

  test('section 2 contains q7-q9', () => {
    expect(sections[1].questionIds).toEqual(['q7', 'q8', 'q9']);
  });

  test('section 3 contains q10-q12', () => {
    expect(sections[2].questionIds).toEqual(['q10', 'q11', 'q12']);
  });

  test('section 4 contains q17', () => {
    expect(sections[3].questionIds).toEqual(['q17']);
  });

  test('section 5 contains q13-q16', () => {
    expect(sections[4].questionIds).toEqual(['q13', 'q14', 'q15', 'q16']);
  });

  test('section 6 contains q19', () => {
    expect(sections[5].questionIds).toEqual(['q19']);
  });

  test('all radio questions have at least 2 options', () => {
    const radioQs = questions.filter((q) => q.type === 'radio');
    for (const q of radioQs) {
      expect(q.options?.length, `${q.id} should have >= 2 options`).toBeGreaterThanOrEqual(2);
    }
  });

  test('q7, q13, q14, q15, q16 have hasOther=true', () => {
    const otherIds = ['q7', 'q13', 'q14', 'q15', 'q16'];
    for (const id of otherIds) {
      const q = questions.find((q) => q.id === id);
      expect(q?.hasOther, `${id} should have hasOther=true`).toBe(true);
    }
  });

  test('q17 is email-signup type with options', () => {
    const q17 = questions.find((q) => q.id === 'q17');
    expect(q17?.type).toBe('email-signup');
    expect(q17?.options?.length).toBeGreaterThanOrEqual(2);
  });

  test('q19 is textarea with 5000 char limit', () => {
    const q19 = questions.find((q) => q.id === 'q19');
    expect(q19?.type).toBe('textarea');
    expect(q19?.maxLength).toBe(5000);
  });

  test('q5, q12, q17, q19 have descriptions', () => {
    const descIds = ['q5', 'q12', 'q17', 'q19'];
    for (const id of descIds) {
      const q = questions.find((q) => q.id === id);
      expect(q?.description, `${id} should have a description`).toBeTruthy();
    }
  });

  test('no question has an empty text field', () => {
    for (const q of questions) {
      expect(q.text.length, `${q.id} should have non-empty text`).toBeGreaterThan(0);
    }
  });
});
