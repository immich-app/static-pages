import { request } from './request';
import { surveyFromApi, questionsFromApi, sectionsFromApiRaw } from '../engines/builder-engine.svelte';
import type { Survey, SurveyWithDetails } from '../types';

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
    closes_at?: string | null;
    max_responses?: number | null;
    randomize_questions?: boolean;
    randomize_options?: boolean;
    password?: string | null;
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
