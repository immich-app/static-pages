import { request } from './request';
import { questionsFromApi } from '../engines/builder-engine.svelte';
import type { QuestionOption, QuestionType, SurveyQuestion } from '../types';
import { getWsClientById } from './survey-ws';

export async function createQuestion(
  surveyId: string,
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
  const ws = getWsClientById(surveyId);
  if (ws?.connected) {
    const data = await ws.request('create-question', { sectionId, ...input });
    return questionsFromApi([data as unknown as Record<string, unknown>])[0];
  }
  const data = await request<Record<string, unknown>>(`/api/surveys/${surveyId}/sections/${sectionId}/questions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return questionsFromApi([data])[0];
}

export async function updateQuestion(
  surveyId: string,
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
  const ws = getWsClientById(surveyId);
  if (ws?.connected) {
    const data = await ws.request('update-question', { id, ...input });
    return questionsFromApi([data as unknown as Record<string, unknown>])[0];
  }
  const data = await request<Record<string, unknown>>(`/api/surveys/${surveyId}/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return questionsFromApi([data])[0];
}

export async function deleteQuestion(surveyId: string, id: string): Promise<void> {
  const ws = getWsClientById(surveyId);
  if (ws?.connected) {
    await ws.request('delete-question', { id });
    return;
  }
  await request(`/api/surveys/${surveyId}/questions/${id}`, { method: 'DELETE' });
}

export async function reorderQuestions(
  surveyId: string,
  sectionId: string,
  items: Array<{ id: string; sort_order: number }>,
): Promise<void> {
  const ws = getWsClientById(surveyId);
  if (ws?.connected) {
    await ws.request('reorder-questions', { sectionId, items });
    return;
  }
  await request(`/api/surveys/${surveyId}/sections/${sectionId}/questions/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}
