import type { BuilderSection } from './builder-types';

export function validateSurvey(title: string, sections: BuilderSection[]): string[] {
  const errors: string[] = [];

  if (!title.trim()) {
    errors.push('Survey title is required');
  }

  if (sections.length === 0) {
    errors.push('Survey must have at least one section');
  }

  for (const section of sections) {
    if (!section.title.trim()) {
      errors.push(`Section "${section.title || '(untitled)'}" needs a title`);
    }

    if (section.questions.length === 0) {
      errors.push(`Section "${section.title || '(untitled)'}" must have at least one question`);
    }

    for (const question of section.questions) {
      if (!question.text.trim()) {
        errors.push(`A question in "${section.title || '(untitled)'}" has no text`);
      }

      if (['radio', 'checkbox', 'dropdown'].includes(question.type) && question.options.length < 2) {
        errors.push(`Question "${question.text || '(untitled)'}" needs at least 2 options`);
      }
    }
  }

  return errors;
}

export function validateSlug(slug: string): string | null {
  if (!slug) return 'Slug is required for publishing';
  if (slug.length < 3) return 'Slug must be at least 3 characters';
  if (slug.length > 50) return 'Slug must be at most 50 characters';
  if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug)) {
    return 'Slug must be lowercase alphanumeric with hyphens, cannot start or end with a hyphen';
  }
  return null;
}
