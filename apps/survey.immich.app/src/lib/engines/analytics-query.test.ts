import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseAnalyticsResponse, queryLiveCounts } from '../../../backend/src/services/analytics-query';

// ── parseAnalyticsResponse ──────────────────────────────────────────────

describe('parseAnalyticsResponse', () => {
  it('parses a standard Cloudflare Analytics Engine SQL response', () => {
    expect.assertions(1);
    const response = JSON.stringify({
      meta: [
        { name: 'type', type: 'String' },
        { name: 'unique_count', type: 'UInt64' },
      ],
      data: [
        { type: 'viewer', unique_count: '3' },
        { type: 'respondent', unique_count: '7' },
      ],
      rows: 2,
    });

    const result = parseAnalyticsResponse(response);
    expect(result).toEqual([
      { type: 'viewer', unique_count: 3 },
      { type: 'respondent', unique_count: 7 },
    ]);
  });

  it('handles numeric unique_count values (not just strings)', () => {
    expect.assertions(1);
    const response = JSON.stringify({
      data: [{ type: 'viewer', unique_count: 5 }],
    });

    const result = parseAnalyticsResponse(response);
    expect(result).toEqual([{ type: 'viewer', unique_count: 5 }]);
  });

  it('returns empty array for empty data', () => {
    expect.assertions(1);
    const response = JSON.stringify({ data: [], rows: 0 });
    expect(parseAnalyticsResponse(response)).toEqual([]);
  });

  it('returns empty array for missing data field', () => {
    expect.assertions(1);
    const response = JSON.stringify({ meta: [], rows: 0 });
    expect(parseAnalyticsResponse(response)).toEqual([]);
  });

  it('returns empty array for invalid JSON', () => {
    expect.assertions(1);
    expect(parseAnalyticsResponse('not json')).toEqual([]);
  });

  it('returns empty array for null data', () => {
    expect.assertions(1);
    const response = JSON.stringify({ data: null });
    expect(parseAnalyticsResponse(response)).toEqual([]);
  });

  it('handles single row with only viewers', () => {
    expect.assertions(1);
    const response = JSON.stringify({
      data: [{ type: 'viewer', unique_count: '1' }],
    });

    const result = parseAnalyticsResponse(response);
    expect(result).toEqual([{ type: 'viewer', unique_count: 1 }]);
  });
});

// ── queryLiveCounts ─────────────────────────────────────────────────────

describe('queryLiveCounts', () => {
  const config = {
    accountId: 'test-account',
    apiToken: 'test-token',
    dataset: 'survey_heartbeats',
  };
  const surveyId = 'survey-123';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends correct SQL query to Cloudflare API', async () => {
    expect.assertions(4);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
    });
    vi.stubGlobal('fetch', mockFetch);

    await queryLiveCounts(config, surveyId);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.cloudflare.com/client/v4/accounts/test-account/analytics_engine/sql');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer test-token');
  });

  it('includes survey ID in SQL WHERE clause', async () => {
    expect.assertions(1);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
    });
    vi.stubGlobal('fetch', mockFetch);

    await queryLiveCounts(config, surveyId);

    const sql = mockFetch.mock.calls[0][1].body;
    expect(sql).toContain("index1 = 'survey-123'");
  });

  it('escapes single quotes in survey ID', async () => {
    expect.assertions(1);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
    });
    vi.stubGlobal('fetch', mockFetch);

    await queryLiveCounts(config, "survey-with-'quotes");

    const sql = mockFetch.mock.calls[0][1].body;
    expect(sql).toContain("index1 = 'survey-with-''quotes'");
  });

  it('returns parsed viewer and respondent counts', async () => {
    expect.assertions(1);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              data: [
                { type: 'viewer', unique_count: '5' },
                { type: 'respondent', unique_count: '12' },
              ],
            }),
          ),
      }),
    );

    const result = await queryLiveCounts(config, surveyId);
    expect(result).toEqual({ activeViewers: 5, activeRespondents: 12 });
  });

  it('returns zeros when only viewers are active', async () => {
    expect.assertions(1);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              data: [{ type: 'viewer', unique_count: '2' }],
            }),
          ),
      }),
    );

    const result = await queryLiveCounts(config, surveyId);
    expect(result).toEqual({ activeViewers: 2, activeRespondents: 0 });
  });

  it('returns zeros on API error', async () => {
    expect.assertions(1);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      }),
    );

    const result = await queryLiveCounts(config, surveyId);
    expect(result).toEqual({ activeViewers: 0, activeRespondents: 0 });
  });

  it('propagates network errors to caller for handling', async () => {
    expect.assertions(1);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    // queryLiveCounts propagates fetch errors — the route handler wraps it in try-catch
    await expect(queryLiveCounts(config, surveyId)).rejects.toThrow('network error');
  });

  it('returns zeros for empty dataset', async () => {
    expect.assertions(1);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ data: [], rows: 0 })),
      }),
    );

    const result = await queryLiveCounts(config, surveyId);
    expect(result).toEqual({ activeViewers: 0, activeRespondents: 0 });
  });

  it('queries with 5-minute lookback window', async () => {
    expect.assertions(1);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
    });
    vi.stubGlobal('fetch', mockFetch);

    await queryLiveCounts(config, surveyId);

    const sql = mockFetch.mock.calls[0][1].body;
    expect(sql).toContain("INTERVAL '5' MINUTE");
  });

  it('counts distinct blob1 values (unique viewer IDs)', async () => {
    expect.assertions(1);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
    });
    vi.stubGlobal('fetch', mockFetch);

    await queryLiveCounts(config, surveyId);

    const sql = mockFetch.mock.calls[0][1].body;
    expect(sql).toContain('COUNT(DISTINCT blob1)');
  });
});
