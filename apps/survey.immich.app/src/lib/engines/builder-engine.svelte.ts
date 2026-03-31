import type { QuestionOption, QuestionType, SurveySection, SurveyQuestion, Survey } from '../types';

export interface BuilderSection extends SurveySection {
  questions: BuilderQuestion[];
}

export interface BuilderQuestion {
  id: string;
  text: string;
  description: string;
  type: QuestionType;
  options: QuestionOption[];
  required: boolean;
  hasOther: boolean;
  otherPrompt: string;
  maxLength: number | null;
  placeholder: string;
  sortOrder: number;
  config: Record<string, unknown>;
}

export function createDefaultQuestion(sortOrder: number): BuilderQuestion {
  return {
    id: '',
    text: '',
    description: '',
    type: 'radio',
    options: [
      { label: 'Option 1', value: 'Option 1' },
      { label: 'Option 2', value: 'Option 2' },
    ],
    required: true,
    hasOther: false,
    otherPrompt: '',
    maxLength: null,
    placeholder: '',
    sortOrder,
    config: {},
  };
}

export function createDefaultSection(sortOrder: number): BuilderSection {
  return {
    id: '',
    title: '',
    description: '',
    sortOrder,
    questions: [],
  };
}

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
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
    return 'Slug must be lowercase alphanumeric with hyphens, cannot start or end with a hyphen';
  }
  return null;
}

export function createQuestionOfType(type: QuestionType, sortOrder: number): BuilderQuestion {
  const base = createDefaultQuestion(sortOrder);
  base.type = type;

  switch (type) {
    case 'radio':
    case 'checkbox':
      // keep default options
      break;
    case 'dropdown':
      // dropdown also needs options like radio
      break;
    case 'rating':
      base.options = [];
      base.config = { scaleMax: 5 };
      break;
    case 'nps':
      base.options = [];
      base.config = { scaleMax: 10 };
      break;
    case 'number':
      base.options = [];
      base.config = { min: 0, max: 100 };
      break;
    case 'likert':
      base.options = [];
      base.config = { scaleMax: 5 };
      break;
    default:
      base.options = [];
      break;
  }

  return base;
}

export function duplicateQuestion(question: BuilderQuestion, sortOrder: number): BuilderQuestion {
  return {
    ...question,
    id: '',
    sortOrder,
    options: [...question.options.map((o) => ({ ...o }))],
    config: { ...question.config },
  };
}

export function duplicateSection(section: BuilderSection, sortOrder: number): BuilderSection {
  return {
    ...section,
    id: '',
    sortOrder,
    questions: section.questions.map((q, i) => duplicateQuestion(q, i)),
  };
}

export function estimateCompletionSeconds(sections: BuilderSection[]): number {
  let total = 0;
  for (const section of sections) {
    for (const q of section.questions) {
      if (q.type === 'textarea') total += 45;
      else if (q.type === 'text' || q.type === 'email') total += 20;
      else total += 15;
    }
  }
  return total;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return 'under 1 min';
  const mins = Math.round(seconds / 60);
  return `~${mins} min`;
}

export function moveItem<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const newItems = [...items];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= newItems.length) {
    return newItems;
  }

  [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
  return newItems;
}

export function sectionsFromApi(apiSections: SurveySection[], apiQuestions: SurveyQuestion[]): BuilderSection[] {
  return apiSections
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((section) => ({
      ...section,
      questions: apiQuestions
        .filter((q) => q.section_id === section.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((q) => ({
          id: q.id,
          text: q.text,
          description: q.description ?? '',
          type: q.type,
          options: q.options ?? [],
          required: q.required,
          hasOther: q.hasOther ?? false,
          otherPrompt: q.otherPrompt ?? '',
          maxLength: q.maxLength ?? null,
          placeholder: q.placeholder ?? '',
          sortOrder: q.sortOrder,
          config: (q.config as Record<string, unknown>) ?? {},
        })),
    }));
}

export function surveyFromApi(apiSurvey: Record<string, unknown>): Survey {
  return {
    id: apiSurvey.id as string,
    title: apiSurvey.title as string,
    description: (apiSurvey.description as string) ?? null,
    slug: (apiSurvey.slug as string) ?? null,
    status: (apiSurvey.status as Survey['status']) ?? 'draft',
    welcomeTitle: (apiSurvey.welcome_title as string) ?? null,
    welcomeDescription: (apiSurvey.welcome_description as string) ?? null,
    thankYouTitle: (apiSurvey.thank_you_title as string) ?? null,
    thankYouDescription: (apiSurvey.thank_you_description as string) ?? null,
    closesAt: (apiSurvey.closes_at as string) ?? null,
    maxResponses: (apiSurvey.max_responses as number) ?? null,
    randomizeQuestions: !!(apiSurvey.randomize_questions as number),
    randomizeOptions: !!(apiSurvey.randomize_options as number),
    createdAt: apiSurvey.created_at as string,
    updatedAt: apiSurvey.updated_at as string,
  };
}

export function questionsFromApi(apiQuestions: Array<Record<string, unknown>>): SurveyQuestion[] {
  return apiQuestions.map((q) => ({
    id: q.id as string,
    section_id: q.section_id as string,
    text: q.text as string,
    description: (q.description as string) ?? undefined,
    type: q.type as QuestionType,
    options: q.options ? JSON.parse(q.options as string) : undefined,
    hasOther: q.has_other === 1,
    otherPrompt: (q.other_prompt as string) ?? undefined,
    maxLength: (q.max_length as number) ?? undefined,
    placeholder: (q.placeholder as string) ?? undefined,
    required: q.required === 1,
    sortOrder: q.sort_order as number,
    conditional: q.conditional ? JSON.parse(q.conditional as string) : undefined,
    config: q.config ? JSON.parse(q.config as string) : undefined,
  }));
}

export function sectionsFromApiRaw(apiSections: Array<Record<string, unknown>>): SurveySection[] {
  return apiSections.map((s) => ({
    id: s.id as string,
    title: s.title as string,
    description: (s.description as string) ?? undefined,
    sortOrder: s.sort_order as number,
  }));
}
