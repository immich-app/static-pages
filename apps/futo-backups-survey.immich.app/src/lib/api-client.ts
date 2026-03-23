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

let pendingQueue: PendingSave[] = [];

const BACKOFF_DELAYS = [1000, 2000, 4000];

/**
 * Saves an answer to the server with exponential backoff retry.
 * Retries up to 3 times on server errors (5xx) and network errors.
 * Does NOT retry on client errors (4xx).
 */
export async function saveAnswer(data: PendingSave): Promise<boolean> {
  for (let attempt = 0; attempt <= BACKOFF_DELAYS.length; attempt++) {
    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'same-origin',
      });
      if (res.ok) return true;
      if (res.status < 500) return false; // client error, don't retry
    } catch {
      // network error, retry
    }
    if (attempt < BACKOFF_DELAYS.length) {
      await new Promise((r) => setTimeout(r, BACKOFF_DELAYS[attempt]));
    }
  }
  return false;
}

let onSaveErrorCallback: ((message: string) => void) | null = null;

/**
 * Registers a callback invoked when a save fails after all retries.
 */
export function onSaveError(cb: (message: string) => void): void {
  onSaveErrorCallback = cb;
}

/**
 * Fire-and-forget: saves an answer without blocking.
 * On total failure (all retries exhausted), queues for later retry and notifies via callback.
 */
export function fireAndForgetSave(data: PendingSave): void {
  saveAnswer(data).then((success) => {
    if (!success) {
      pendingQueue.push(data);
      onSaveErrorCallback?.('Failed to save answer. Your response will be retried automatically.');
    }
  });
}

/**
 * Re-attempts all queued saves that previously failed.
 */
export function flushPendingQueue(): void {
  const queue = [...pendingQueue];
  pendingQueue = [];
  for (const item of queue) {
    fireAndForgetSave(item);
  }
}

/**
 * Returns the current pending queue (for testing).
 */
export function getPendingQueue(): PendingSave[] {
  return pendingQueue;
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
