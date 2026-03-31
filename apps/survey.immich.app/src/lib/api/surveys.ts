import type { QuestionOption, QuestionType } from '../types';
import { surveyFromApi, questionsFromApi, sectionsFromApiRaw } from '../engines/builder-engine.svelte';
import type { Survey, SurveySection, SurveyQuestion, SurveyWithDetails } from '../types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function listSurveys(): Promise<Survey[]> {
  const data = await request<Array<Record<string, unknown>>>('/api/surveys');
  return data.map(surveyFromApi);
}

export async function getSurvey(id: string): Promise<SurveyWithDetails> {
  const data = await request<{
    survey: Record<string, unknown>;
    sections: Array<Record<string, unknown>>;
    questions: Array<Record<string, unknown>>;
  }>(`/api/surveys/${id}`);
  return {
    survey: surveyFromApi(data.survey),
    sections: sectionsFromApiRaw(data.sections),
    questions: questionsFromApi(data.questions),
  };
}

export async function createSurvey(input: { title: string; description?: string }): Promise<Survey> {
  const data = await request<Record<string, unknown>>('/api/surveys', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return surveyFromApi(data);
}

export async function updateSurvey(
  id: string,
  input: {
    title?: string | null;
    description?: string | null;
    slug?: string | null;
    welcome_title?: string | null;
    welcome_description?: string | null;
    thank_you_title?: string | null;
    thank_you_description?: string | null;
  },
): Promise<Survey> {
  // Filter out undefined keys so we only send fields the user explicitly set
  const filtered = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
  const data = await request<Record<string, unknown>>(`/api/surveys/${id}`, {
    method: 'PUT',
    body: JSON.stringify(filtered),
  });
  return surveyFromApi(data);
}

export async function deleteSurvey(id: string): Promise<void> {
  await request(`/api/surveys/${id}`, { method: 'DELETE' });
}

export async function publishSurvey(id: string): Promise<Survey> {
  const data = await request<Record<string, unknown>>(`/api/surveys/${id}/publish`, {
    method: 'PUT',
  });
  return surveyFromApi(data);
}

export async function unpublishSurvey(id: string): Promise<Survey> {
  const data = await request<Record<string, unknown>>(`/api/surveys/${id}/unpublish`, {
    method: 'PUT',
  });
  return surveyFromApi(data);
}

export async function createSection(
  surveyId: string,
  input: { title: string; description?: string },
): Promise<SurveySection> {
  const data = await request<Record<string, unknown>>(`/api/surveys/${surveyId}/sections`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return sectionsFromApiRaw([data])[0];
}

export async function updateSection(
  id: string,
  input: { title?: string; description?: string },
): Promise<SurveySection> {
  const data = await request<Record<string, unknown>>(`/api/sections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return sectionsFromApiRaw([data])[0];
}

export async function deleteSection(id: string): Promise<void> {
  await request(`/api/sections/${id}`, { method: 'DELETE' });
}

export async function reorderSections(
  surveyId: string,
  items: Array<{ id: string; sort_order: number }>,
): Promise<void> {
  await request(`/api/surveys/${surveyId}/sections/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}

export async function createQuestion(
  sectionId: string,
  input: {
    text: string;
    description?: string;
    type: QuestionType;
    options?: QuestionOption[];
    required?: boolean;
    has_other?: boolean;
    other_prompt?: string;
    max_length?: number;
    placeholder?: string;
  },
): Promise<SurveyQuestion> {
  const data = await request<Record<string, unknown>>(`/api/sections/${sectionId}/questions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return questionsFromApi([data])[0];
}

export async function updateQuestion(
  id: string,
  input: {
    section_id?: string;
    text?: string;
    description?: string;
    type?: QuestionType;
    options?: QuestionOption[];
    required?: boolean;
    has_other?: boolean;
    other_prompt?: string;
    max_length?: number;
    placeholder?: string;
  },
): Promise<SurveyQuestion> {
  const data = await request<Record<string, unknown>>(`/api/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return questionsFromApi([data])[0];
}

export async function deleteQuestion(id: string): Promise<void> {
  await request(`/api/questions/${id}`, { method: 'DELETE' });
}

export async function reorderQuestions(
  sectionId: string,
  items: Array<{ id: string; sort_order: number }>,
): Promise<void> {
  await request(`/api/sections/${sectionId}/questions/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}

export async function getPublishedSurvey(slug: string): Promise<SurveyWithDetails> {
  const data = await request<{
    survey: Record<string, unknown>;
    sections: Array<Record<string, unknown>>;
    questions: Array<Record<string, unknown>>;
  }>(`/api/s/${slug}`);
  return {
    survey: surveyFromApi(data.survey),
    sections: sectionsFromApiRaw(data.sections),
    questions: questionsFromApi(data.questions),
  };
}

export async function duplicateSurvey(id: string): Promise<SurveyWithDetails> {
  const data = await request<{
    survey: Record<string, unknown>;
    sections: Array<Record<string, unknown>>;
    questions: Array<Record<string, unknown>>;
  }>(`/api/surveys/${id}/duplicate`, { method: 'POST' });
  return {
    survey: surveyFromApi(data.survey),
    sections: sectionsFromApiRaw(data.sections),
    questions: questionsFromApi(data.questions),
  };
}

export async function exportResults(id: string, format: 'csv' | 'json'): Promise<void> {
  const res = await fetch(`/api/surveys/${id}/results/export?format=${format}`);
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `survey-results.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function getSurveyResults(id: string): Promise<{
  respondentCounts: { total: number; completed: number };
  results: Array<{
    questionId: string;
    answers: Array<{ value: string; otherText: string | null; count: number }>;
  }>;
}> {
  return request(`/api/surveys/${id}/results`);
}
