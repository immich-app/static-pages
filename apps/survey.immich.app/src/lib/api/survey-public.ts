import { request } from './request';
import { surveyFromApi, questionsFromApi, sectionsFromApiRaw } from '../engines/builder-engine.svelte';
import type { SurveyWithDetails } from '../types';

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

export async function authenticateSurvey(slug: string, password: string): Promise<void> {
  await request(`/api/s/${slug}/auth`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function sendHeartbeat(slug: string, viewerId: string, type: 'viewer' | 'respondent'): Promise<void> {
  // Fire-and-forget, no error handling
  fetch(`/api/s/${slug}/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ viewerId, type }),
  }).catch(() => {});
}
