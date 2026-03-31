import { describe, it, expect } from 'vitest';
import { questionTemplates, getTemplatesByCategory, type QuestionTemplate } from './question-templates';
import type { QuestionType } from '../types';

const validQuestionTypes: QuestionType[] = [
  'radio',
  'checkbox',
  'text',
  'textarea',
  'email',
  'rating',
  'nps',
  'number',
  'dropdown',
  'likert',
];

describe('questionTemplates', () => {
  it('contains at least one template', () => {
    expect(questionTemplates.length).toBeGreaterThan(0);
  });

  it.each(questionTemplates)('template "$name" has required fields', (template: QuestionTemplate) => {
    expect(template.id).toBeTruthy();
    expect(typeof template.id).toBe('string');
    expect(template.name).toBeTruthy();
    expect(typeof template.name).toBe('string');
    expect(template.category).toBeTruthy();
    expect(typeof template.category).toBe('string');
    expect(template.question).toBeDefined();
  });

  it.each(questionTemplates)('template "$name" has a valid question type', (template: QuestionTemplate) => {
    expect(validQuestionTypes).toContain(template.question.type);
  });

  it.each(questionTemplates)('template "$name" produces a valid question structure', (template: QuestionTemplate) => {
    const q = template.question;
    expect(typeof q.text).toBe('string');
    expect(q.text.length).toBeGreaterThan(0);
    expect(typeof q.required).toBe('boolean');
    expect(Array.isArray(q.options)).toBe(true);
    expect(typeof q.hasOther).toBe('boolean');
    expect(typeof q.otherPrompt).toBe('string');
    expect(typeof q.placeholder).toBe('string');
    expect(typeof q.description).toBe('string');
  });

  it('all template IDs are unique', () => {
    const ids = questionTemplates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getTemplatesByCategory', () => {
  it('returns a non-empty map', () => {
    const map = getTemplatesByCategory();
    expect(map.size).toBeGreaterThan(0);
  });

  it('every category has at least one template', () => {
    const map = getTemplatesByCategory();
    for (const [category, templates] of map) {
      expect(templates.length).toBeGreaterThan(0);
      expect(typeof category).toBe('string');
    }
  });

  it('total templates across categories matches questionTemplates length', () => {
    const map = getTemplatesByCategory();
    let total = 0;
    for (const templates of map.values()) {
      total += templates.length;
    }
    expect(total).toBe(questionTemplates.length);
  });

  it('all categories found in templates are present as keys', () => {
    const map = getTemplatesByCategory();
    const categoriesFromTemplates = new Set(questionTemplates.map((t) => t.category));
    for (const cat of categoriesFromTemplates) {
      expect(map.has(cat)).toBe(true);
    }
  });
});
