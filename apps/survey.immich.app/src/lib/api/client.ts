import type { SurveyAnswer } from '../types';
import type { SurveyWsClient } from './survey-ws';

interface PendingSave {
  questionId: string;
  value: string;
  otherText?: string;
  /** Client-measured milliseconds spent on this question before committing. */
  answerMs?: number;
}

const BACKOFF_DELAYS = [1000, 2000, 4000];
const INACTIVITY_MS = 10_000;
const FLUSH_THRESHOLD = 4;

/**
 * Client transport mode.
 *
 *   - 'ws': WebSocket command ops are supported (Cloudflare Workers + DO). Data
 *     ops (submit-answers, complete, resume) go exclusively over the WS.
 *     HTTP is only used for the sendBeacon fallback on page unload.
 *
 *   - 'http': WebSocket command ops aren't available (Node.js self-hosted mode).
 *     Data ops go over HTTP with cookie auth.
 *
 * Mode is committed on the first resume — once chosen, it doesn't switch.
 * This avoids per-request HTTP fallbacks that would trigger cookie auth on
 * every submission and reduce server capacity.
 */
type Mode = 'ws' | 'http' | 'unknown';

export function createApiClient(slug: string) {
  const base = `/api/s/${slug}`;

  const answerBuffer: Map<string, PendingSave> = new Map();
  let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  let unflushedCount = 0;
  let onSaveErrorCallback: ((message: string) => void) | null = null;
  let wsClient: SurveyWsClient | null = null;
  let mode: Mode = 'unknown';

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

  async function saveBatch(answers: PendingSave[]): Promise<boolean> {
    if (mode === 'ws') {
      // WS-only — if the socket is down, re-buffer and retry on next flush.
      // No HTTP fallback: it would trigger per-request cookie auth and hurt
      // server capacity.
      if (!wsClient?.connected) return false;
      try {
        await wsClient.request('submit-answers', { answers });
        return true;
      } catch {
        return false;
      }
    }
    // http mode (Node.js self-hosted): HTTP with retry
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

    const success = await saveBatch(batch);
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
    // Page unload path — sendBeacon is HTTP-only. This is the ONE place where
    // HTTP is used in ws mode, since the WebSocket can't reliably finish
    // pending sends during unload.
    if (answerBuffer.size === 0) return;

    if (inactivityTimer !== null) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
    unflushedCount = 0;

    const batch = [...answerBuffer.values()];
    answerBuffer.clear();

    const blob = new Blob([JSON.stringify({ answers: batch })], { type: 'application/json' });
    navigator.sendBeacon(`${base}/answers/batch`, blob);
  }

  async function fetchResume(): Promise<{
    answers?: Record<string, SurveyAnswer>;
    nextQuestionIndex?: number;
    isComplete?: boolean;
  }> {
    // Probe the transport. Try WS first if a client is attached; if it works,
    // commit to 'ws' mode for the rest of the session. Otherwise fall back to
    // HTTP and commit to 'http' mode. Subsequent calls don't re-probe.
    if (wsClient) {
      // Wait briefly for WS to finish connecting (auto-reconnect may still be in progress)
      for (let i = 0; i < 20 && !wsClient.connected; i++) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (wsClient.connected) {
        try {
          const result = (await wsClient.request('resume', {})) as {
            answers?: Record<string, SurveyAnswer>;
            nextQuestionIndex?: number;
            isComplete?: boolean;
          };
          mode = 'ws';
          return result;
        } catch {
          // WS resume failed — server likely doesn't support command ops (Node.js mode)
        }
      }
    }

    // HTTP path (no WS client, or WS resume failed)
    mode = 'http';
    const res = await fetch(`${base}/resume`, { credentials: 'same-origin' });
    if (!res.ok) {
      throw new Error(`Failed to load survey (${res.status})`);
    }
    return res.json();
  }

  async function postComplete(): Promise<void> {
    if (mode === 'ws') {
      if (!wsClient?.connected) {
        throw new Error('Connection lost — please try again in a moment');
      }
      await wsClient.request('complete', {});
      return;
    }
    // http mode
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
