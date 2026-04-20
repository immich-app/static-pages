import { request } from './request';
import { sectionsFromApiRaw } from '../engines/builder-engine.svelte';
import type { SurveySection } from '../types';
import { getWsClientById } from './survey-ws';

export async function createSection(
  surveyId: string,
  input: { title: string; description?: string },
): Promise<SurveySection> {
  const ws = getWsClientById(surveyId);
  if (ws?.connected) {
    const data = await ws.request('create-section', input);
    return sectionsFromApiRaw([data as unknown as Record<string, unknown>])[0];
  }
  const data = await request<Record<string, unknown>>(`/api/surveys/${surveyId}/sections`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return sectionsFromApiRaw([data])[0];
}

export async function updateSection(
  surveyId: string,
  id: string,
  input: { title?: string; description?: string },
): Promise<SurveySection> {
  const ws = getWsClientById(surveyId);
  if (ws?.connected) {
    const data = await ws.request('update-section', { id, ...input });
    return sectionsFromApiRaw([data as unknown as Record<string, unknown>])[0];
  }
  const data = await request<Record<string, unknown>>(`/api/surveys/${surveyId}/sections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return sectionsFromApiRaw([data])[0];
}

export async function deleteSection(surveyId: string, id: string): Promise<void> {
  const ws = getWsClientById(surveyId);
  if (ws?.connected) {
    await ws.request('delete-section', { id });
    return;
  }
  await request(`/api/surveys/${surveyId}/sections/${id}`, { method: 'DELETE' });
}

export async function reorderSections(
  surveyId: string,
  items: Array<{ id: string; sort_order: number }>,
): Promise<void> {
  const ws = getWsClientById(surveyId);
  if (ws?.connected) {
    await ws.request('reorder-sections', { items });
    return;
  }
  await request(`/api/surveys/${surveyId}/sections/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}
