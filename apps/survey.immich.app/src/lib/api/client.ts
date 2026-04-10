import type { SurveyAnswer } from '../types';
import type { SurveyWsClient } from './survey-ws';

interface PendingSave {
  questionId: string;
  value: string;
  otherText?: string;
}

const BACKOFF_DELAYS = [1000, 2000, 4000];
const INACTIVITY_MS = 10_000;
const FLUSH_THRESHOLD = 4;

export function createApiClient(slug: string) {
  const base = `/api/s/${slug}`;

  const answerBuffer: Map<string, PendingSave> = new Map();
  let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  let unflushedCount = 0;
  let onSaveErrorCallback: ((message: string) => void) | null = null;
  let wsClient: SurveyWsClient | null = null;

  function setWsClient(client: SurveyWsClient | null) {
    wsClient = client;
  }

  function resetInactivityTimer() {
    if (inactivityTimer !== null) {
      clearTimeout(inactivityTimer);
    }
    inactivityTimer = setTimeout(() => {
      flushBuffer();
    }, INACTIVITY_MS);
  }

  function bufferAnswer(data: PendingSave): void {
    answerBuffer.set(data.questionId, data);
    unflushedCount++;
    resetInactivityTimer();

    if (unflushedCount >= FLUSH_THRESHOLD) {
      flushBuffer();
    }
  }

  async function saveBatchWs(answers: PendingSave[]): Promise<boolean> {
    // Prefer WebSocket — the connection is tagged with the respondent ID
    // at upgrade time, so no per-request auth is needed.
    if (wsClient?.connected) {
      try {
        await wsClient.request('submit-answers', { answers });
        return true;
      } catch {
        // WS request failed (timeout, disconnect, etc.) — fall back to HTTP
      }
    }
    return saveBatchHttp(answers);
  }

  async function saveBatchHttp(answers: PendingSave[]): Promise<boolean> {
    for (let attempt = 0; attempt <= BACKOFF_DELAYS.length; attempt++) {
      try {
        const res = await fetch(`${base}/answers/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
          credentials: 'same-origin',
        });
        if (res.ok) return true;
        if (res.status < 500) return false;
      } catch {
        // network error, retry
      }
      if (attempt < BACKOFF_DELAYS.length) {
        await new Promise((r) => setTimeout(r, BACKOFF_DELAYS[attempt]));
      }
    }
    return false;
  }

  async function flushBuffer(): Promise<boolean> {
    if (answerBuffer.size === 0) return true;

    if (inactivityTimer !== null) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }

    const batch = [...answerBuffer.values()];
    answerBuffer.clear();

    const success = await saveBatchWs(batch);
    if (success) {
      unflushedCount = 0;
    } else {
      for (const item of batch) {
        if (!answerBuffer.has(item.questionId)) {
          answerBuffer.set(item.questionId, item);
        }
      }
      onSaveErrorCallback?.('Failed to save answers. Your responses will be retried automatically.');
    }
    return success;
  }

  function flushBufferSync(): void {
    if (answerBuffer.size === 0) return;

    if (inactivityTimer !== null) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
    unflushedCount = 0;

    const batch = [...answerBuffer.values()];
    answerBuffer.clear();

    // sendBeacon is HTTP-only (last resort on page unload)
    const blob = new Blob([JSON.stringify({ answers: batch })], { type: 'application/json' });
    navigator.sendBeacon(`${base}/answers/batch`, blob);
  }

  async function fetchResume(): Promise<{
    answers?: Record<string, SurveyAnswer>;
    nextQuestionIndex?: number;
    isComplete?: boolean;
  }> {
    // Prefer WS resume — no round trip, respondent created on WS upgrade.
    // HTTP fallback for Node.js self-hosted mode (no DO WS command path).
    if (wsClient) {
      // Wait briefly for WS to open if still connecting
      for (let i = 0; i < 20 && !wsClient.connected; i++) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (wsClient.connected) {
        try {
          return (await wsClient.request('resume', {})) as {
            answers?: Record<string, SurveyAnswer>;
            nextQuestionIndex?: number;
            isComplete?: boolean;
          };
        } catch {
          // fall through to HTTP
        }
      }
    }
    const res = await fetch(`${base}/resume`, { credentials: 'same-origin' });
    if (!res.ok) {
      throw new Error(`Failed to load survey (${res.status})`);
    }
    return res.json();
  }

  async function postComplete(): Promise<void> {
    // Prefer WebSocket (auth via connection tag). Fall back to HTTP cookie-auth on failure.
    if (wsClient?.connected) {
      try {
        await wsClient.request('complete', {});
        return;
      } catch {
        // fall through to HTTP
      }
    }
    const res = await fetch(`${base}/complete`, {
      method: 'POST',
      credentials: 'same-origin',
    });
    if (!res.ok) {
      throw new Error(`Failed to submit survey (${res.status})`);
    }
  }

  function onSaveError(cb: (message: string) => void): void {
    onSaveErrorCallback = cb;
  }

  function getBufferSize(): number {
    return answerBuffer.size;
  }

  function destroy(): void {
    if (inactivityTimer !== null) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  }

  return {
    bufferAnswer,
    flushBuffer,
    flushBufferSync,
    fetchResume,
    postComplete,
    onSaveError,
    getBufferSize,
    destroy,
    setWsClient,
  };
}
