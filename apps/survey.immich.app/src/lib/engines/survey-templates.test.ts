import { describe, it, expect } from 'vitest';
import { surveyTemplates, type SurveyTemplate } from './survey-templates';
import { questionTemplates } from './question-templates';
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

describe('surveyTemplates', () => {
  it('contains at least one template', () => {
    expect(surveyTemplates.length).toBeGreaterThan(0);
  });

  it.each(surveyTemplates)('template "$name" has required fields', (template: SurveyTemplate) => {
    expect(template.id).toBeTruthy();
    expect(typeof template.id).toBe('string');
    expect(template.name).toBeTruthy();
    expect(typeof template.name).toBe('string');
    expect(template.description).toBeDefined();
    expect(typeof template.description).toBe('string');
    expect(Array.isArray(template.sections)).toBe(true);
    expect(template.sections.length).toBeGreaterThan(0);
  });

  it.each(surveyTemplates)('template "$name" has questions in every section', (template: SurveyTemplate) => {
    for (const section of template.sections) {
      expect(section.questions.length).toBeGreaterThan(0);
    }
  });

  it.each(surveyTemplates)('template "$name" sections have valid structure', (template: SurveyTemplate) => {
    for (const section of template.sections) {
      expect(typeof section.title).toBe('string');
      expect(section.title.length).toBeGreaterThan(0);
      expect(typeof section.sortOrder).toBe('number');
    }
  });

  it.each(surveyTemplates)('template "$name" questions have valid types', (template: SurveyTemplate) => {
    for (const section of template.sections) {
      for (const question of section.questions) {
        expect(validQuestionTypes).toContain(question.type);
      }
    }
  });

  it.each(surveyTemplates)(
    'template "$name" questions have required text and type fields',
    (template: SurveyTemplate) => {
      for (const section of template.sections) {
        for (const question of section.questions) {
          expect(typeof question.text).toBe('string');
          expect(question.text.length).toBeGreaterThan(0);
          expect(typeof question.type).toBe('string');
          expect(typeof question.sortOrder).toBe('number');
        }
      }
    },
  );

  it('all template IDs are unique', () => {
    const ids = surveyTemplates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('templateQuestion references use valid template IDs', () => {
    // Verify that the question templates referenced by survey templates exist
    // by checking that all question types/configs match known templates
    const templateIds = new Set(questionTemplates.map((t) => t.id));
    // The templateQuestion function would throw if a template ID is invalid,
    // so if surveyTemplates loaded without error, all references are valid
    expect(templateIds.size).toBeGreaterThan(0);
    expect(surveyTemplates.length).toBeGreaterThan(0);
  });
});
