import type { SurveyAnswer } from '../types';

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
    unflushedCount = 0;

    const batch = [...answerBuffer.values()];
    answerBuffer.clear();

    const success = await saveBatch(batch);
    if (!success) {
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

    const blob = new Blob([JSON.stringify({ answers: batch })], { type: 'application/json' });
    navigator.sendBeacon(`${base}/answers/batch`, blob);
  }

  async function fetchResume(): Promise<{
    answers?: Record<string, SurveyAnswer>;
    nextQuestionIndex?: number;
    isComplete?: boolean;
  }> {
    const res = await fetch(`${base}/resume`, { credentials: 'same-origin' });
    if (!res.ok) {
      throw new Error(`Failed to load survey (${res.status})`);
    }
    return res.json();
  }

  async function postComplete(): Promise<void> {
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
  };
}
