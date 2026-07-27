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
import { getWsClientById, type SurveyWsClient } from './survey-ws';

/**
 * Prefer a WebSocket command op when a live socket is attached, but fall back to
 * the HTTP endpoint when there is no socket OR the op is rejected. The fallback
 * matters in self-hosted Node mode, where the WS is presence-only and rejects
 * command ops — without it these calls would surface an error (or, before the
 * presence server learned to reject, hang for 30s) instead of loading via HTTP.
 */
async function wsOrHttp<T>(
  surveyId: string,
  send: (ws: SurveyWsClient) => Promise<unknown>,
  http: () => Promise<T>,
): Promise<T> {
  const ws = getWsClientById(surveyId);
  if (ws?.connected) {
    try {
      return (await send(ws)) as T;
    } catch {
      // Fall through to HTTP.
    }
  }
  return http();
}

export async function getSurveyResults(id: string): Promise<{
  respondentCounts: { total: number; completed: number };
  results: Array<{
    questionId: string;
    answers: Array<{ value: string; otherText: string | null; count: number }>;
  }>;
}> {
  return wsOrHttp(
    id,
    (ws) => ws.request('get-results', {}),
    () => request(`/api/surveys/${id}/results`),
  );
}

export async function getSurveyTimeline(
  id: string,
  granularity: 'minute' | 'hour' | 'day' = 'day',
): Promise<TimelineDataPoint[]> {
  return wsOrHttp(
    id,
    (ws) => ws.request('get-timeline', { granularity }),
    () => request(`/api/surveys/${id}/results/timeline?granularity=${granularity}`),
  );
}

export async function getSurveyDropoff(id: string): Promise<DropoffDataPoint[]> {
  return wsOrHttp(
    id,
    (ws) => ws.request('get-dropoff', {}),
    () => request(`/api/surveys/${id}/results/dropoff`),
  );
}

export async function getSurveyCompletionTimes(id: string): Promise<CompletionTimesPayload> {
  return wsOrHttp(
    id,
    (ws) => ws.request('get-completion-times', {}),
    () => request(`/api/surveys/${id}/results/completion-times`),
  );
}

export async function getSurveyQuestionTimings(id: string): Promise<QuestionTimingEntry[]> {
  return wsOrHttp(
    id,
    (ws) => ws.request('get-question-timings', {}),
    () => request(`/api/surveys/${id}/results/question-timings`),
  );
}

export async function listRespondents(
  id: string,
  offset = 0,
  limit = 20,
): Promise<{ respondents: RespondentSummary[]; total: number }> {
  return wsOrHttp(
    id,
    (ws) => ws.request('list-respondents', { offset, limit }),
    () => request(`/api/surveys/${id}/results/respondents?offset=${offset}&limit=${limit}`),
  );
}

export async function getRespondent(surveyId: string, respondentId: string): Promise<RespondentDetail> {
  return wsOrHttp(
    surveyId,
    (ws) => ws.request('get-respondent', { respondentId }),
    () => request(`/api/surveys/${surveyId}/results/respondents/${respondentId}`),
  );
}

export async function searchAnswers(
  id: string,
  query: string,
  questionId?: string,
  pagination?: { offset?: number; limit?: number },
): Promise<{ results: SearchResult[]; total: number; offset: number; limit: number }> {
  return wsOrHttp(
    id,
    (ws) =>
      ws.request('search-answers', {
        query,
        questionId,
        offset: pagination?.offset,
        limit: pagination?.limit,
      }),
    () => {
      const params = new URLSearchParams({ q: query });
      if (questionId) params.set('questionId', questionId);
      if (pagination?.offset) params.set('offset', String(pagination.offset));
      if (pagination?.limit) params.set('limit', String(pagination.limit));
      return request(`/api/surveys/${id}/results/search?${params}`);
    },
  );
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
    try {
      return (await ws.request('get-live-results', {})) as LiveResults;
    } catch {
      // Fall through to HTTP (self-hosted presence-only WS).
    }
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
    try {
      await ws.request('delete-respondent', { respondentId });
      return;
    } catch {
      // Fall through to HTTP (self-hosted presence-only WS).
    }
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
