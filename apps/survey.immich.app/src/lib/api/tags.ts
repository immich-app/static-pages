import { request } from './request';

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export async function listTags(): Promise<Tag[]> {
  return request('/api/tags');
}

export async function createTag(input: { name: string; color?: string }): Promise<Tag> {
  return request('/api/tags', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateTag(id: string, input: { name?: string; color?: string | null }): Promise<Tag> {
  return request(`/api/tags/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export async function deleteTag(id: string): Promise<void> {
  return request(`/api/tags/${id}`, { method: 'DELETE' });
}

export async function getSurveyTags(surveyId: string): Promise<Tag[]> {
  return request(`/api/surveys/${surveyId}/tags`);
}

export async function setSurveyTags(surveyId: string, tagIds: string[]): Promise<void> {
  return request(`/api/surveys/${surveyId}/tags`, { method: 'PUT', body: JSON.stringify({ tagIds }) });
}
