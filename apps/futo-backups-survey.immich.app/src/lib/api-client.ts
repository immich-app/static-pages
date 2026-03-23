import type { SurveyAnswer } from './types';

/**
 * Verifies a Cloudflare Turnstile token with the backend.
 */
export async function verifyTurnstile(turnstileToken: string): Promise<void> {
  const res = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ turnstileToken }),
    credentials: 'same-origin',
  });
  if (!res.ok) {
    throw new Error('Challenge verification failed. Please try again.');
  }
}

interface PendingSave {
  questionId: string;
  value: string;
  otherText?: string;
}

let answerBuffer: Map<string, PendingSave> = new Map();
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let unflushedCount = 0;

const BACKOFF_DELAYS = [1000, 2000, 4000];
const INACTIVITY_MS = 10_000;
const FLUSH_THRESHOLD = 4;

let onSaveErrorCallback: ((message: string) => void) | null = null;

/**
 * Registers a callback invoked when a batch save fails after all retries.
 */
export function onSaveError(cb: (message: string) => void): void {
  onSaveErrorCallback = cb;
}

function resetInactivityTimer() {
  if (inactivityTimer !== null) {
    clearTimeout(inactivityTimer);
  }
  inactivityTimer = setTimeout(() => {
    flushBuffer();
  }, INACTIVITY_MS);
}

/**
 * Buffers an answer for later batch submission.
 * Auto-flushes after 4 answers or 10 seconds of inactivity.
 */
export function bufferAnswer(data: PendingSave): void {
  answerBuffer.set(data.questionId, data);
  unflushedCount++;
  resetInactivityTimer();

  if (unflushedCount >= FLUSH_THRESHOLD) {
    flushBuffer();
  }
}

/**
 * Sends a batch of answers to the server with exponential backoff retry.
 */
async function saveBatch(answers: PendingSave[]): Promise<boolean> {
  for (let attempt = 0; attempt <= BACKOFF_DELAYS.length; attempt++) {
    try {
      const res = await fetch('/api/answers/batch', {
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

/**
 * Flushes the answer buffer to the server as a batch.
 * Returns true on success, false on failure.
 * On failure, items are re-added to the buffer for the next flush attempt.
 */
export async function flushBuffer(): Promise<boolean> {
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
    // Re-add failed items, but don't overwrite newer entries
    for (const item of batch) {
      if (!answerBuffer.has(item.questionId)) {
        answerBuffer.set(item.questionId, item);
      }
    }
    onSaveErrorCallback?.('Failed to save answers. Your responses will be retried automatically.');
  }
  return success;
}

/**
 * Synchronous flush for beforeunload — uses sendBeacon.
 */
export function flushBufferSync(): void {
  if (answerBuffer.size === 0) return;

  if (inactivityTimer !== null) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  unflushedCount = 0;

  const batch = [...answerBuffer.values()];
  answerBuffer.clear();

  const blob = new Blob([JSON.stringify({ answers: batch })], { type: 'application/json' });
  navigator.sendBeacon('/api/answers/batch', blob);
}

/**
 * Returns the current buffer size (for testing).
 */
export function getBufferSize(): number {
  return answerBuffer.size;
}

/**
 * Fetches resume data from the server.
 * Returns existing answers and next question index, or isComplete flag.
 */
export async function fetchResume(): Promise<{
  answers?: Record<string, { value: string; otherText?: string }>;
  nextQuestionIndex?: number;
  isComplete?: boolean;
  isVerified?: boolean;
}> {
  const res = await fetch('/api/resume', { credentials: 'same-origin' });
  if (!res.ok) {
    throw new Error(`Failed to load survey (${res.status})`);
  }
  return res.json();
}

/**
 * Marks the survey as complete on the server.
 */
export async function postComplete(): Promise<void> {
  const res = await fetch('/api/complete', {
    method: 'POST',
    credentials: 'same-origin',
  });
  if (!res.ok) {
    throw new Error(`Failed to submit survey (${res.status})`);
  }
}
