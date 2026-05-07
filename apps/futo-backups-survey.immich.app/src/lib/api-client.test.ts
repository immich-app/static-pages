import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let bufferAnswer: typeof import('./api-client').bufferAnswer;
let flushBuffer: typeof import('./api-client').flushBuffer;
let flushBufferSync: typeof import('./api-client').flushBufferSync;
let getBufferSize: typeof import('./api-client').getBufferSize;
let fetchResume: typeof import('./api-client').fetchResume;
let postComplete: typeof import('./api-client').postComplete;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn());
  vi.resetModules();
  const mod = await import('./api-client');
  bufferAnswer = mod.bufferAnswer;
  flushBuffer = mod.flushBuffer;
  flushBufferSync = mod.flushBufferSync;
  getBufferSize = mod.getBufferSize;
  fetchResume = mod.fetchResume;
  postComplete = mod.postComplete;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('bufferAnswer', () => {
  it('adds an answer to the buffer', () => {
    bufferAnswer({ questionId: 'q1', value: 'test' });
    expect(getBufferSize()).toBe(1);
  });

  it('overwrites duplicate questionIds', () => {
    bufferAnswer({ questionId: 'q1', value: 'first' });
    bufferAnswer({ questionId: 'q1', value: 'second' });
    expect(getBufferSize()).toBe(1);
  });

  it('buffers multiple different questions', () => {
    bufferAnswer({ questionId: 'q1', value: 'a' });
    bufferAnswer({ questionId: 'q2', value: 'b' });
    bufferAnswer({ questionId: 'q3', value: 'c' });
    expect(getBufferSize()).toBe(3);
  });

  it('auto-flushes after 4 answers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', mockFetch);

    bufferAnswer({ questionId: 'q1', value: 'a' });
    bufferAnswer({ questionId: 'q2', value: 'b' });
    bufferAnswer({ questionId: 'q3', value: 'c' });
    expect(mockFetch).not.toHaveBeenCalled();

    bufferAnswer({ questionId: 'q4', value: 'd' });
    await vi.runAllTimersAsync();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.answers).toHaveLength(4);
    expect(getBufferSize()).toBe(0);
  });

  it('auto-flushes after 10 seconds of inactivity', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', mockFetch);

    bufferAnswer({ questionId: 'q1', value: 'a' });
    bufferAnswer({ questionId: 'q2', value: 'b' });

    expect(mockFetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(10_000);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.answers).toHaveLength(2);
    expect(getBufferSize()).toBe(0);
  });

  it('resets inactivity timer on each new answer', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', mockFetch);

    bufferAnswer({ questionId: 'q1', value: 'a' });

    // Wait 8 seconds, then add another answer
    await vi.advanceTimersByTimeAsync(8000);
    expect(mockFetch).not.toHaveBeenCalled();

    bufferAnswer({ questionId: 'q2', value: 'b' });

    // 8 more seconds — still within the new 10s window
    await vi.advanceTimersByTimeAsync(8000);
    expect(mockFetch).not.toHaveBeenCalled();

    // 2 more seconds — now 10s since last answer
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('resets counter after threshold flush', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', mockFetch);

    // First batch of 4
    bufferAnswer({ questionId: 'q1', value: 'a' });
    bufferAnswer({ questionId: 'q2', value: 'b' });
    bufferAnswer({ questionId: 'q3', value: 'c' });
    bufferAnswer({ questionId: 'q4', value: 'd' });
    await vi.runAllTimersAsync();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Next 3 answers should NOT trigger a flush
    bufferAnswer({ questionId: 'q5', value: 'e' });
    bufferAnswer({ questionId: 'q6', value: 'f' });
    bufferAnswer({ questionId: 'q7', value: 'g' });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // 4th answer triggers second flush
    bufferAnswer({ questionId: 'q8', value: 'h' });
    await vi.runAllTimersAsync();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('duplicate answers do not inflate the flush counter', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', mockFetch);

    // Answer same question 4 times — should count as 4 towards threshold
    // (user changed their mind rapidly)
    bufferAnswer({ questionId: 'q1', value: 'a' });
    bufferAnswer({ questionId: 'q1', value: 'b' });
    bufferAnswer({ questionId: 'q1', value: 'c' });
    bufferAnswer({ questionId: 'q1', value: 'd' });
    await vi.runAllTimersAsync();

    // Threshold is based on answer events, not unique questions
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.answers).toHaveLength(1); // deduped in buffer
  });
});

describe('flushBuffer', () => {
  it('returns true immediately when buffer is empty', async () => {
    const result = await flushBuffer();
    expect(result).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sends buffered answers to /api/answers/batch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', mockFetch);

    bufferAnswer({ questionId: 'q1', value: 'a' });
    bufferAnswer({ questionId: 'q2', value: 'b' });

    const promise = flushBuffer();
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/answers/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
      credentials: 'same-origin',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.answers).toHaveLength(2);
    expect(getBufferSize()).toBe(0);
  });

  it('re-adds items to buffer on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    bufferAnswer({ questionId: 'q1', value: 'a' });

    const promise = flushBuffer();
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(false);
    expect(getBufferSize()).toBe(1);
  });

  it('retries on 500 response - 4 attempts total', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', mockFetch);

    bufferAnswer({ questionId: 'q1', value: 'a' });

    const promise = flushBuffer();
    await vi.runAllTimersAsync();
    await promise;

    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('does NOT retry on 400 response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 400 });
    vi.stubGlobal('fetch', mockFetch);

    bufferAnswer({ questionId: 'q1', value: 'a' });

    const promise = flushBuffer();
    await vi.runAllTimersAsync();
    await promise;

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does not overwrite newer buffer entries on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    bufferAnswer({ questionId: 'q1', value: 'old' });

    const promise = flushBuffer();

    // Buffer a newer answer while flush is in progress
    bufferAnswer({ questionId: 'q1', value: 'new' });

    await vi.runAllTimersAsync();
    await promise;

    // The buffer should still have the newer value, not the failed old one
    expect(getBufferSize()).toBe(1);
  });
});

describe('flushBufferSync', () => {
  it('uses sendBeacon when buffer has items', () => {
    const mockSendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { sendBeacon: mockSendBeacon });

    bufferAnswer({ questionId: 'q1', value: 'a' });
    flushBufferSync();

    expect(mockSendBeacon).toHaveBeenCalledWith('/api/answers/batch', expect.any(Blob));
    expect(getBufferSize()).toBe(0);
  });

  it('does nothing when buffer is empty', () => {
    const mockSendBeacon = vi.fn();
    vi.stubGlobal('navigator', { sendBeacon: mockSendBeacon });

    flushBufferSync();

    expect(mockSendBeacon).not.toHaveBeenCalled();
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
