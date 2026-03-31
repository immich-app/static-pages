import { request } from './request';
import type {
  TimelineDataPoint,
  DropoffDataPoint,
  RespondentSummary,
  RespondentDetail,
  SearchResult,
  LiveCounts,
} from '../types';

export async function getSurveyResults(id: string): Promise<{
  respondentCounts: { total: number; completed: number };
  results: Array<{
    questionId: string;
    answers: Array<{ value: string; otherText: string | null; count: number }>;
  }>;
}> {
  return request(`/api/surveys/${id}/results`);
}

export async function getSurveyTimeline(
  id: string,
  granularity: 'day' | 'hour' = 'day',
): Promise<TimelineDataPoint[]> {
  return request(`/api/surveys/${id}/results/timeline?granularity=${granularity}`);
}

export async function getSurveyDropoff(id: string): Promise<DropoffDataPoint[]> {
  return request(`/api/surveys/${id}/results/dropoff`);
}

export async function listRespondents(
  id: string,
  offset = 0,
  limit = 20,
): Promise<{ respondents: RespondentSummary[]; total: number }> {
  return request(`/api/surveys/${id}/results/respondents?offset=${offset}&limit=${limit}`);
}

export async function getRespondent(
  surveyId: string,
  respondentId: string,
): Promise<RespondentDetail> {
  return request(`/api/surveys/${surveyId}/results/respondents/${respondentId}`);
}

export async function searchAnswers(
  id: string,
  query: string,
  questionId?: string,
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query });
  if (questionId) params.set('questionId', questionId);
  return request(`/api/surveys/${id}/results/search?${params}`);
}

export async function getLiveResults(id: string): Promise<{
  respondentCounts: { total: number; completed: number };
  results: Array<{
    questionId: string;
    answers: Array<{ value: string; otherText: string | null; count: number }>;
  }>;
  liveCounts: LiveCounts;
}> {
  return request(`/api/surveys/${id}/results/live`);
}

export async function deleteRespondent(surveyId: string, respondentId: string): Promise<void> {
  await request(`/api/surveys/${surveyId}/results/respondents/${respondentId}`, {
    method: 'DELETE',
  });
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
