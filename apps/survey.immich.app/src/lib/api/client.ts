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
/** How many consecutive flush failures before we surface the toast. */
const FAILURES_BEFORE_TOAST = 2;
/** How long to wait for a transient WS reconnect before declaring failure. */
const WS_RECONNECT_WAIT_MS = 2000;

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
    // Only count genuinely NEW questions toward the flush threshold.
    // Repeated updates to the same question (e.g. every keystroke in a
    // text field) replace the buffer entry but don't advance the counter
    // — otherwise typing "Hello" would flush after 4 characters.
    const isNew = !answerBuffer.has(data.questionId);
    answerBuffer.set(data.questionId, data);
    if (isNew) unflushedCount++;
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
      // Briefly wait for the auto-reconnect to complete before giving up,
      // so a transient drop doesn't surface as a save failure.
      if (!wsClient?.connected) {
        const deadline = Date.now() + WS_RECONNECT_WAIT_MS;
        while (!wsClient?.connected && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 100));
        }
        if (!wsClient?.connected) return false;
      }
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
      consecutiveFailures = 0;
      onSaveSuccessCallback?.();
    } else {
      for (const item of batch) {
        if (!answerBuffer.has(item.questionId)) {
          answerBuffer.set(item.questionId, item);
        }
      }
      consecutiveFailures++;
      // Don't alarm the respondent on transient blips — buffered answers
      // will retry on the next flush trigger (threshold, inactivity, or
      // unload via sendBeacon). Surface a toast only after the failures
      // have persisted, so the message is meaningful when it does appear.
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

  function onSaveSuccess(cb: () => void): void {
    onSaveSuccessCallback = cb;
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
    onSaveSuccess,
    getBufferSize,
    destroy,
    setWsClient,
  };
}
