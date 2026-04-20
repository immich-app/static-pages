import { request } from './request';
import { surveyFromApi, questionsFromApi, sectionsFromApiRaw } from '../engines/builder-engine.svelte';
import type { SurveyWithDetails } from '../types';
import { getWsClientBySlug } from './survey-ws';

export async function getPublishedSurvey(slug: string): Promise<SurveyWithDetails> {
  // Use WS if a connection already exists (never creates one)
  try {
    const ws = getWsClientBySlug(slug);
    if (ws?.connected) {
      const data = (await ws.request('get-public-survey', {})) as unknown as {
        survey: Record<string, unknown>;
        sections: Array<Record<string, unknown>>;
        questions: Array<Record<string, unknown>>;
        requiresPassword?: boolean;
      };
      return {
        survey: surveyFromApi({ ...data.survey, requiresPassword: data.requiresPassword }),
        sections: sectionsFromApiRaw(data.sections),
        questions: questionsFromApi(data.questions),
      };
    }
  } catch {
    // Fall through to HTTP
  }

  const data = await request<{
    survey: Record<string, unknown>;
    sections: Array<Record<string, unknown>>;
    questions: Array<Record<string, unknown>>;
    requiresPassword?: boolean;
  }>(`/api/s/${slug}`);
  return {
    survey: surveyFromApi({ ...data.survey, requiresPassword: data.requiresPassword }),
    sections: sectionsFromApiRaw(data.sections),
    questions: questionsFromApi(data.questions),
  };
}

// Auth stays HTTP — sets password cookie
export async function authenticateSurvey(slug: string, password: string): Promise<void> {
  await request(`/api/s/${slug}/auth`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}
