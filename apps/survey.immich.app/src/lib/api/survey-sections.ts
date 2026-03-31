import { request } from './request';
import { sectionsFromApiRaw } from '../engines/builder-engine.svelte';
import type { SurveySection } from '../types';

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
