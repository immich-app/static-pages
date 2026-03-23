import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Module will be imported after it exists
let saveAnswer: typeof import('./api-client').saveAnswer;
let fireAndForgetSave: typeof import('./api-client').fireAndForgetSave;
let flushPendingQueue: typeof import('./api-client').flushPendingQueue;
let getPendingQueue: typeof import('./api-client').getPendingQueue;
let fetchResume: typeof import('./api-client').fetchResume;
let postComplete: typeof import('./api-client').postComplete;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn());
  // Re-import module fresh each test to reset pendingQueue
  vi.resetModules();
  const mod = await import('./api-client');
  saveAnswer = mod.saveAnswer;
  fireAndForgetSave = mod.fireAndForgetSave;
  flushPendingQueue = mod.flushPendingQueue;
  getPendingQueue = mod.getPendingQueue;
  fetchResume = mod.fetchResume;
  postComplete = mod.postComplete;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('saveAnswer', () => {
  it('calls fetch with correct body and headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', mockFetch);

    const data = { questionId: 'q1', value: 'test' };
    const promise = saveAnswer(data);
    await vi.runAllTimersAsync();
    await promise;

    expect(mockFetch).toHaveBeenCalledWith('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'same-origin',
    });
  });

  it('returns true on 204 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));

    const promise = saveAnswer({ questionId: 'q1', value: 'test' });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(true);
  });

  it('retries on 500 response - fetch called 4 times total', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', mockFetch);

    const promise = saveAnswer({ questionId: 'q1', value: 'test' });
    await vi.runAllTimersAsync();
    await promise;

    expect(mockFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  it('does NOT retry on 400 response - fetch called once', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 400 });
    vi.stubGlobal('fetch', mockFetch);

    const promise = saveAnswer({ questionId: 'q1', value: 'test' });
    await vi.runAllTimersAsync();
    await promise;

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on network error (fetch throws)', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', mockFetch);

    const promise = saveAnswer({ questionId: 'q1', value: 'test' });
    await vi.runAllTimersAsync();
    await promise;

    expect(mockFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  it('uses delays of 1000, 2000, 4000 ms between retries', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', mockFetch);

    const promise = saveAnswer({ questionId: 'q1', value: 'test' });

    // Initial call happens immediately
    await vi.advanceTimersByTimeAsync(0);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // After 1000ms: first retry
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // After 2000ms more: second retry
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // After 4000ms more: third retry
    await vi.advanceTimersByTimeAsync(4000);
    expect(mockFetch).toHaveBeenCalledTimes(4);

    await promise;
  });
});

describe('fireAndForgetSave', () => {
  it('adds to pendingQueue on total failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    fireAndForgetSave({ questionId: 'q1', value: 'test' });
    await vi.runAllTimersAsync();
    // Allow microtasks to settle
    await vi.advanceTimersByTimeAsync(0);

    expect(getPendingQueue()).toHaveLength(1);
    expect(getPendingQueue()[0]).toEqual({ questionId: 'q1', value: 'test' });
  });
});

describe('flushPendingQueue', () => {
  it('re-fires queued items', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', mockFetch);

    // First: make a save fail to populate the queue
    fireAndForgetSave({ questionId: 'q1', value: 'test' });
    await vi.runAllTimersAsync();
    await vi.advanceTimersByTimeAsync(0);
    expect(getPendingQueue()).toHaveLength(1);

    // Now make fetch succeed and flush
    mockFetch.mockResolvedValue({ ok: true, status: 204 });
    const callsBefore = mockFetch.mock.calls.length;
    flushPendingQueue();
    await vi.runAllTimersAsync();
    await vi.advanceTimersByTimeAsync(0);

    // Queue should be empty now (re-fired successfully)
    expect(getPendingQueue()).toHaveLength(0);
    // fetch should have been called at least once more
    expect(mockFetch.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});

describe('fetchResume', () => {
  it('calls GET /api/resume with credentials: same-origin', async () => {
    const mockResponse = { answers: {}, nextQuestionIndex: 0 };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await fetchResume();

    expect(fetch).toHaveBeenCalledWith('/api/resume', { credentials: 'same-origin' });
    expect(result).toEqual(mockResponse);
  });
});

describe('postComplete', () => {
  it('calls POST /api/complete with credentials: same-origin', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));

    await postComplete();

    expect(fetch).toHaveBeenCalledWith('/api/complete', {
      method: 'POST',
      credentials: 'same-origin',
    });
  });
});
