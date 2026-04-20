import { request } from './request';
import type {
  TimelineDataPoint,
  DropoffDataPoint,
  CompletionTimesPayload,
  QuestionTimingEntry,
  RespondentSummary,
  RespondentDetail,
  SearchResult,
  LiveCounts,
} from '../types';
import { getWsClientById } from './survey-ws';

export async function getSurveyResults(id: string): Promise<{
  respondentCounts: { total: number; completed: number };
  results: Array<{
    questionId: string;
    answers: Array<{ value: string; otherText: string | null; count: number }>;
  }>;
}> {
  const ws = getWsClientById(id);
  if (ws?.connected) {
    return ws.request('get-results', {}) as Promise<{
      respondentCounts: { total: number; completed: number };
      results: Array<{
        questionId: string;
        answers: Array<{ value: string; otherText: string | null; count: number }>;
      }>;
    }>;
  }
  return request(`/api/surveys/${id}/results`);
}

export async function getSurveyTimeline(
  id: string,
  granularity: 'minute' | 'hour' | 'day' = 'day',
): Promise<TimelineDataPoint[]> {
  const ws = getWsClientById(id);
  if (ws?.connected) {
    return ws.request('get-timeline', { granularity }) as Promise<TimelineDataPoint[]>;
  }
  return request(`/api/surveys/${id}/results/timeline?granularity=${granularity}`);
}

export async function getSurveyDropoff(id: string): Promise<DropoffDataPoint[]> {
  const ws = getWsClientById(id);
  if (ws?.connected) {
    return ws.request('get-dropoff', {}) as Promise<DropoffDataPoint[]>;
  }
  return request(`/api/surveys/${id}/results/dropoff`);
}

export async function getSurveyCompletionTimes(id: string): Promise<CompletionTimesPayload> {
  const ws = getWsClientById(id);
  if (ws?.connected) {
    return ws.request('get-completion-times', {}) as Promise<CompletionTimesPayload>;
  }
  return request(`/api/surveys/${id}/results/completion-times`);
}

export async function getSurveyQuestionTimings(id: string): Promise<QuestionTimingEntry[]> {
  const ws = getWsClientById(id);
  if (ws?.connected) {
    return ws.request('get-question-timings', {}) as Promise<QuestionTimingEntry[]>;
  }
  return request(`/api/surveys/${id}/results/question-timings`);
}

export async function listRespondents(
  id: string,
  offset = 0,
  limit = 20,
): Promise<{ respondents: RespondentSummary[]; total: number }> {
  const ws = getWsClientById(id);
  if (ws?.connected) {
    return ws.request('list-respondents', { offset, limit }) as Promise<{
      respondents: RespondentSummary[];
      total: number;
    }>;
  }
  return request(`/api/surveys/${id}/results/respondents?offset=${offset}&limit=${limit}`);
}

export async function getRespondent(surveyId: string, respondentId: string): Promise<RespondentDetail> {
  const ws = getWsClientById(surveyId);
  if (ws?.connected) {
    return ws.request('get-respondent', { respondentId }) as Promise<RespondentDetail>;
  }
  return request(`/api/surveys/${surveyId}/results/respondents/${respondentId}`);
}

export async function searchAnswers(
  id: string,
  query: string,
  questionId?: string,
  pagination?: { offset?: number; limit?: number },
): Promise<{ results: SearchResult[]; total: number; offset: number; limit: number }> {
  const ws = getWsClientById(id);
  if (ws?.connected) {
    return ws.request('search-answers', {
      query,
      questionId,
      offset: pagination?.offset,
      limit: pagination?.limit,
    }) as Promise<{ results: SearchResult[]; total: number; offset: number; limit: number }>;
  }
  const params = new URLSearchParams({ q: query });
  if (questionId) params.set('questionId', questionId);
  if (pagination?.offset) params.set('offset', String(pagination.offset));
  if (pagination?.limit) params.set('limit', String(pagination.limit));
  return request(`/api/surveys/${id}/results/search?${params}`);
}

type LiveResults = {
  respondentCounts: { total: number; completed: number };
  results: Array<{
    questionId: string;
    answers: Array<{ value: string; otherText: string | null; count: number }>;
  }>;
  liveCounts: LiveCounts;
};

const liveResultsEtags = new Map<string, string>();

export async function getLiveResults(id: string): Promise<LiveResults | null> {
  const ws = getWsClientById(id);
  if (ws?.connected) {
    return ws.request('get-live-results', {}) as Promise<LiveResults>;
  }

  const headers: Record<string, string> = {};
  const cachedEtag = liveResultsEtags.get(id);
  if (cachedEtag) {
    headers['If-None-Match'] = cachedEtag;
  }

  const res = await fetch(`/api/surveys/${id}/results/live`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
  });

  if (res.status === 304) {
    return null;
  }

  if (!res.ok) {
    if (res.status === 401) {
      window.location.reload();
      throw new Error('Authentication required');
    }
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }

  const etag = res.headers.get('ETag');
  if (etag) {
    liveResultsEtags.set(id, etag);
  }

  return res.json() as Promise<LiveResults>;
}

export async function deleteRespondent(surveyId: string, respondentId: string): Promise<void> {
  const ws = getWsClientById(surveyId);
  if (ws?.connected) {
    await ws.request('delete-respondent', { respondentId });
    return;
  }
  await request(`/api/surveys/${surveyId}/results/respondents/${respondentId}`, {
    method: 'DELETE',
  });
}

// Export stays HTTP — binary file download
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
