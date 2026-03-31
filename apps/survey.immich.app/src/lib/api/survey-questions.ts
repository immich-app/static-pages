import { request } from './request';
import { questionsFromApi } from '../engines/builder-engine.svelte';
import type { QuestionOption, QuestionType, SurveyQuestion } from '../types';

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
