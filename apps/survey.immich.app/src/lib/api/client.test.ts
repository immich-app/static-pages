import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApiClient } from './client';

describe('createApiClient', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve({}) }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('creates isolated instances per slug', () => {
    const client1 = createApiClient('survey-a');
    const client2 = createApiClient('survey-b');
    client1.bufferAnswer({ questionId: 'q1', value: 'yes' });
    expect(client1.getBufferSize()).toBe(1);
    expect(client2.getBufferSize()).toBe(0);
    client1.destroy();
    client2.destroy();
  });

  it('buffers answers and auto-flushes at threshold', async () => {
    const client = createApiClient('test-survey');

    client.bufferAnswer({ questionId: 'q1', value: 'a' });
    client.bufferAnswer({ questionId: 'q2', value: 'b' });
    client.bufferAnswer({ questionId: 'q3', value: 'c' });
    expect(client.getBufferSize()).toBe(3);

    client.bufferAnswer({ questionId: 'q4', value: 'd' });

    // Flush is async, let microtasks run
    await vi.runAllTimersAsync();

    expect(fetch).toHaveBeenCalledWith('/api/s/test-survey/answers/batch', expect.objectContaining({ method: 'POST' }));
    expect(client.getBufferSize()).toBe(0);
    client.destroy();
  });

  it('auto-flushes on inactivity', async () => {
    const client = createApiClient('test-survey');

    client.bufferAnswer({ questionId: 'q1', value: 'a' });
    expect(client.getBufferSize()).toBe(1);

    await vi.advanceTimersByTimeAsync(10_000);

    expect(fetch).toHaveBeenCalledWith('/api/s/test-survey/answers/batch', expect.objectContaining({ method: 'POST' }));
    client.destroy();
  });

  it('re-adds to buffer on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const onError = vi.fn();
    const client = createApiClient('test-survey');
    client.onSaveError(onError);

    client.bufferAnswer({ questionId: 'q1', value: 'a' });

    // First failure: silent — answers stay buffered to retry on the next flush.
    const firstFlush = client.flushBuffer();
    await vi.runAllTimersAsync();
    const firstResult = await firstFlush;

    expect(firstResult).toBe(false);
    expect(client.getBufferSize()).toBe(1);
    expect(onError).not.toHaveBeenCalled();

    // Second consecutive failure: surfaces the toast so the respondent
    // knows save is genuinely struggling and can act on it.
    const secondFlush = client.flushBuffer();
    await vi.runAllTimersAsync();
    const secondResult = await secondFlush;

    expect(secondResult).toBe(false);
    expect(client.getBufferSize()).toBe(1);
    expect(onError).toHaveBeenCalled();
    client.destroy();
  });

  it('clears the toast after a successful flush following failures', async () => {
    let succeed = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: succeed, status: succeed ? 204 : 500 })),
    );

    const onError = vi.fn();
    const onSuccess = vi.fn();
    const client = createApiClient('test-survey');
    client.onSaveError(onError);
    client.onSaveSuccess(onSuccess);

    client.bufferAnswer({ questionId: 'q1', value: 'a' });

    // Two consecutive flush failures (each saveBatchHttp exhausts its
    // own retries internally before returning false).
    const first = client.flushBuffer();
    await vi.runAllTimersAsync();
    await first;
    const second = client.flushBuffer();
    await vi.runAllTimersAsync();
    await second;
    expect(onError).toHaveBeenCalled();

    // Next flush succeeds — success callback fires so the UI can dismiss
    // the lingering toast.
    succeed = true;
    const third = client.flushBuffer();
    await vi.runAllTimersAsync();
    const ok = await third;
    expect(ok).toBe(true);
    expect(onSuccess).toHaveBeenCalled();
    client.destroy();
  });

  it('preserves newer entries when failed batch is re-added', async () => {
    // All calls fail
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const client = createApiClient('test-survey');
    client.bufferAnswer({ questionId: 'q1', value: 'old' });

    // Start flush — this clears the buffer, then tries to send
    const flushPromise = client.flushBuffer();

    // While flush is in-flight, buffer a newer value for the same question
    client.bufferAnswer({ questionId: 'q1', value: 'new' });

    // Let backoff timers resolve so saveBatch finishes
    await vi.runAllTimersAsync();
    await flushPromise;

    // The buffer should have 1 entry: the "new" value, not overwritten by the failed "old"
    expect(client.getBufferSize()).toBe(1);
    client.destroy();
  });

  it('uses correct slug in URLs', async () => {
    const client = createApiClient('my-custom-slug');
    await client.fetchResume();
    expect(fetch).toHaveBeenCalledWith(
      '/api/s/my-custom-slug/resume',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
    client.destroy();
  });
});
