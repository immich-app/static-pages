import type { QuestionType, Survey, SurveyQuestion, SurveySection } from '../types';
import type { BuilderSection } from './builder-types';

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
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
    hasPassword: !!(apiSurvey.password_hash as string),
    requiresPassword: !!(apiSurvey.requiresPassword as boolean),
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
    options: safeJsonParse(q.options as string | null, undefined),
    hasOther: q.has_other === 1,
    otherPrompt: (q.other_prompt as string) ?? undefined,
    maxLength: (q.max_length as number) ?? undefined,
    placeholder: (q.placeholder as string) ?? undefined,
    required: q.required === 1,
    sortOrder: q.sort_order as number,
    conditional: safeJsonParse(q.conditional as string | null, undefined),
    config: safeJsonParse(q.config as string | null, undefined),
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
