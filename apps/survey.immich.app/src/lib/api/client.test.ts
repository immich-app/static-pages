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

    const flushPromise = client.flushBuffer();
    // Advance through all backoff delays
    await vi.runAllTimersAsync();
    const result = await flushPromise;

    expect(result).toBe(false);
    expect(client.getBufferSize()).toBe(1);
    expect(onError).toHaveBeenCalled();
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
