import type { SurveyAnswer } from '../types';
import type { SurveyWsClient } from './survey-ws';
import { BATCH_ANSWER_LIMIT } from '$shared/ws-protocol';

interface PendingSave {
  questionId: string;
  value: string;
  otherText?: string;
  /**
  Client-measured milliseconds spent on this question before committing.
  */
  answerMs?: number;
}

const BACKOFF_DELAYS = [1000, 2000, 4000];
const INACTIVITY_MS = 10_000;
const FLUSH_THRESHOLD = 4;
const FAILURES_BEFORE_TOAST = 2;
const WS_RECONNECT_WAIT_MS = 2000;

/**
 * Transport for data ops (submit-answers, complete, resume): 'ws' on Cloudflare
 * Workers + DO, 'http' with cookie auth in Node.js self-hosted mode. Committed
 * on the first resume and never switched — a per-request HTTP fallback would
 * re-run cookie auth on every submission and cut server capacity.
 */
type Mode = 'ws' | 'http' | 'unknown';

export function createApiClient(slug: string) {
  const base = `/api/s/${slug}`;

  const answerBuffer: Map<string, PendingSave> = new Map();
  let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  let unflushedCount = 0;
  let consecutiveFailures = 0;
  let onSaveErrorCallback: ((message: string) => void) | null = null;
  let onSaveSuccessCallback: (() => void) | null = null;
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
    // Only NEW questions advance the counter — otherwise every keystroke in a
    // text field would count and typing "Hello" would flush after 4 characters.
    const isNew = !answerBuffer.has(data.questionId);
    answerBuffer.set(data.questionId, data);
    if (isNew) {unflushedCount++;}
    resetInactivityTimer();

    if (unflushedCount >= FLUSH_THRESHOLD) {
      flushBuffer();
    }
  }

  async function saveBatch(answers: PendingSave[]): Promise<boolean> {
    if (mode === 'ws') {
      // No HTTP fallback here (see Mode) — wait briefly for the auto-reconnect
      // instead, so a transient drop doesn't surface as a save failure.
      if (!wsClient?.connected) {
        const deadline = Date.now() + WS_RECONNECT_WAIT_MS;
        while (!wsClient?.connected && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 100));
        }
        if (!wsClient?.connected) {return false;}
      }
      try {
        await wsClient.request('submit-answers', { answers });
        return true;
      } catch {
        return false;
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
        });
        if (res.ok) {return true;}
        if (res.status < 500) {return false;}
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
    if (answerBuffer.size === 0) {return true;}

    if (inactivityTimer !== null) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }

    const all = [...answerBuffer.values()];
    answerBuffer.clear();

    // Chunk to the server's cap: an oversized submit-answers request is
    // rejected wholesale (400), dropping every buffered answer at once.
    const failed: PendingSave[] = [];
    for (let i = 0; i < all.length; i += BATCH_ANSWER_LIMIT) {
      const chunk = all.slice(i, i + BATCH_ANSWER_LIMIT);
      const ok = await saveBatch(chunk);
      if (!ok) {failed.push(...chunk);}
    }
    const success = failed.length === 0;
    if (success) {
      unflushedCount = 0;
      consecutiveFailures = 0;
      onSaveSuccessCallback?.();
    } else {
      for (const item of failed) {
        if (!answerBuffer.has(item.questionId)) {
          answerBuffer.set(item.questionId, item);
        }
      }
      consecutiveFailures++;
      // Stay silent on transient blips — buffered answers retry on the next
      // flush trigger; only a persistent failure is worth alarming the user.
      if (consecutiveFailures >= FAILURES_BEFORE_TOAST) {
        onSaveErrorCallback?.('Failed to save answers. Your responses will be retried automatically.');
      }
    }
    return success;
  }

  function flushBufferSync(): void {
    // Page unload path — sendBeacon is HTTP-only. This is the ONE place where
    // HTTP is used in ws mode, since the WebSocket can't reliably finish
    // pending sends during unload.
    if (answerBuffer.size === 0) {return;}

    if (inactivityTimer !== null) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
    unflushedCount = 0;

    const all = [...answerBuffer.values()];
    answerBuffer.clear();

    // Same per-batch cap as flushBuffer — send one beacon per chunk so a large
    // pending buffer isn't rejected as a single oversized request on unload.
    for (let i = 0; i < all.length; i += BATCH_ANSWER_LIMIT) {
      const chunk = all.slice(i, i + BATCH_ANSWER_LIMIT);
      const blob = new Blob([JSON.stringify({ answers: chunk })], { type: 'application/json' });
      navigator.sendBeacon(`${base}/answers/batch`, blob);
    }
  }

  async function fetchResume(): Promise<{
    answers?: Record<string, SurveyAnswer>;
    nextQuestionIndex?: number;
    isComplete?: boolean;
  }> {
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

    mode = 'http';
    const res = await fetch(`${base}/resume`);
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
    const res = await fetch(`${base}/complete`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Failed to submit survey (${res.status})`);
    }
  }

  function onSaveError(cb: (message: string) => void): void {
    onSaveErrorCallback = cb;
  }

  function onSaveSuccess(cb: () => void): void {
    onSaveSuccessCallback = cb;
  }

  function getBufferSize(): number {
    return answerBuffer.size;
  }

  function destroy(): void {
    if (inactivityTimer === null) {
    	return;
    }

    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }

  return {
    bufferAnswer,
    flushBuffer,
    flushBufferSync,
    fetchResume,
    postComplete,
    onSaveError,
    onSaveSuccess,
    getBufferSize,
    destroy,
    setWsClient,
  };
}
