import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  TimelineDataPoint,
  DropoffDataPoint,
  RespondentSummary,
  RespondentDetail,
  SearchResult,
  LiveCounts,
  SurveyQuestion,
  QuestionType,
} from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────

function makeQuestion(overrides: Partial<SurveyQuestion> & { id: string }): SurveyQuestion {
  return {
    section_id: 's1',
    text: `Question ${overrides.id}`,
    type: 'radio',
    required: true,
    sortOrder: 0,
    ...overrides,
  };
}

// ── NPS computation (extracted from NpsScoreCard logic) ──────────────────

interface AnswerData {
  value: string;
  count: number;
}

function computeNps(answers: AnswerData[]) {
  let total = 0,
    promoters = 0,
    passives = 0,
    detractors = 0;
  for (const a of answers) {
    const score = Number(a.value);
    if (Number.isNaN(score)) continue;
    total += a.count;
    if (score >= 9) promoters += a.count;
    else if (score >= 7) passives += a.count;
    else detractors += a.count;
  }
  const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null;
  return { total, promoters, passives, detractors, npsScore };
}

function npsLabel(npsScore: number | null): string {
  if (npsScore === null) return '';
  if (npsScore >= 50) return 'Excellent';
  if (npsScore >= 0) return 'Good';
  if (npsScore >= -50) return 'Needs improvement';
  return 'Critical';
}

// ── Drop-off rate computation ────────────────────────────────────────────

function computeDropoffRate(reached: number, answered: number): number {
  if (reached === 0) return 0;
  return Math.round(((reached - answered) / reached) * 100);
}

// ── Chart data mapping (from QuestionResult component) ───────────────────

interface ChartAnswer {
  value: string;
  otherText: string | null;
  count: number;
}

function toChartData(answers: ChartAnswer[], totalResponses: number) {
  const sorted = [...answers].sort((a, b) => b.count - a.count);
  return sorted.map((a) => ({
    label: a.value + (a.otherText ? `: ${a.otherText}` : ''),
    value: a.count,
    percentage: totalResponses > 0 ? (a.count / totalResponses) * 100 : 0,
  }));
}

// ── Word cloud data preparation ──────────────────────────────────────────

function toWordCloudData(answers: ChartAnswer[]) {
  const sorted = [...answers].sort((a, b) => b.count - a.count);
  return sorted.map((a) => ({ text: a.value, count: a.count }));
}

// ── Filterable questions logic (from FilterBar) ──────────────────────────

const FILTERABLE_TYPES: QuestionType[] = ['radio', 'checkbox', 'dropdown', 'nps', 'rating', 'likert'];

function filterableQuestions(questions: SurveyQuestion[]): SurveyQuestion[] {
  return questions.filter((q) => FILTERABLE_TYPES.includes(q.type));
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Type shape validation', () => {
  it('TimelineDataPoint has required fields', () => {
    const point: TimelineDataPoint = { period: '2026-03-01', started: 10, completed: 5 };
    expect(point.period).toBe('2026-03-01');
    expect(point.started).toBe(10);
    expect(point.completed).toBe(5);
  });

  it('DropoffDataPoint has required fields', () => {
    const dp: DropoffDataPoint = {
      questionId: 'q1',
      questionText: 'How are you?',
      respondentsReached: 100,
      respondentsAnswered: 80,
      dropoffRate: 20,
    };
    expect(dp.questionId).toBe('q1');
    expect(dp.dropoffRate).toBe(20);
  });

  it('RespondentSummary has required fields', () => {
    const rs: RespondentSummary = {
      id: 'r1',
      createdAt: '2026-03-01T00:00:00Z',
      completedAt: '2026-03-01T00:05:00Z',
      answerCount: 5,
    };
    expect(rs.answerCount).toBe(5);
    expect(rs.completedAt).toBeTruthy();
  });

  it('RespondentSummary allows null completedAt', () => {
    const rs: RespondentSummary = {
      id: 'r2',
      createdAt: '2026-03-01T00:00:00Z',
      completedAt: null,
      answerCount: 2,
    };
    expect(rs.completedAt).toBeNull();
  });

  it('RespondentDetail has answers array', () => {
    const rd: RespondentDetail = {
      id: 'r1',
      createdAt: '2026-03-01T00:00:00Z',
      completedAt: null,
      answers: [
        { questionId: 'q1', questionText: 'Q1', questionType: 'radio', value: 'yes', otherText: null },
      ],
    };
    expect(rd.answers).toHaveLength(1);
    expect(rd.answers[0].questionType).toBe('radio');
  });

  it('SearchResult has required fields', () => {
    const sr: SearchResult = {
      respondentId: 'r1',
      questionId: 'q1',
      questionText: 'How?',
      answer: 'Good',
    };
    expect(sr.respondentId).toBe('r1');
    expect(sr.answer).toBe('Good');
  });

  it('LiveCounts has viewer and respondent counts', () => {
    const lc: LiveCounts = { activeViewers: 5, activeRespondents: 3 };
    expect(lc.activeViewers).toBe(5);
    expect(lc.activeRespondents).toBe(3);
  });
});

describe('API URL construction', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getSurveyTimeline constructs URL with day granularity', async () => {
    const { getSurveyTimeline } = await import('../api/surveys');
    await getSurveyTimeline('abc123', 'day');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/surveys/abc123/results/timeline?granularity=day');
  });

  it('getSurveyTimeline constructs URL with hour granularity', async () => {
    const { getSurveyTimeline } = await import('../api/surveys');
    await getSurveyTimeline('abc123', 'hour');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/surveys/abc123/results/timeline?granularity=hour');
  });

  it('getSurveyTimeline defaults to day granularity', async () => {
    const { getSurveyTimeline } = await import('../api/surveys');
    await getSurveyTimeline('abc123');
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/surveys/abc123/results/timeline?granularity=day');
  });

  it('getSurveyDropoff constructs correct URL', async () => {
    const { getSurveyDropoff } = await import('../api/surveys');
    await getSurveyDropoff('xyz');
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/surveys/xyz/results/dropoff');
  });

  it('listRespondents constructs URL with offset and limit', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ respondents: [], total: 0 }),
    });
    const { listRespondents } = await import('../api/surveys');
    await listRespondents('s1', 10, 50);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/surveys/s1/results/respondents?offset=10&limit=50');
  });

  it('listRespondents uses default offset=0 and limit=20', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ respondents: [], total: 0 }),
    });
    const { listRespondents } = await import('../api/surveys');
    await listRespondents('s1');
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/surveys/s1/results/respondents?offset=0&limit=20');
  });

  it('getRespondent constructs correct URL with both IDs', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 'r1', answers: [] }),
    });
    const { getRespondent } = await import('../api/surveys');
    await getRespondent('s1', 'r1');
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/surveys/s1/results/respondents/r1');
  });

  it('searchAnswers constructs URL with query param', async () => {
    const { searchAnswers } = await import('../api/surveys');
    await searchAnswers('s1', 'hello world');
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('/api/surveys/s1/results/search?');
    expect(url).toContain('q=hello+world');
  });

  it('searchAnswers includes questionId param when provided', async () => {
    const { searchAnswers } = await import('../api/surveys');
    await searchAnswers('s1', 'test', 'q5');
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('questionId=q5');
  });

  it('searchAnswers omits questionId when not provided', async () => {
    const { searchAnswers } = await import('../api/surveys');
    await searchAnswers('s1', 'test');
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).not.toContain('questionId');
  });

  it('getLiveResults constructs correct URL', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          respondentCounts: { total: 0, completed: 0 },
          results: [],
          liveCounts: { activeViewers: 0, activeRespondents: 0 },
        }),
    });
    const { getLiveResults } = await import('../api/surveys');
    await getLiveResults('s1');
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/surveys/s1/results/live');
  });
});

describe('sendHeartbeat', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends POST with correct body', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);
    const { sendHeartbeat } = await import('../api/surveys');
    await sendHeartbeat('my-slug', 'v123', 'viewer');
    expect(fetchSpy).toHaveBeenCalledWith('/api/s/my-slug/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewerId: 'v123', type: 'viewer' }),
    });
  });

  it('does not throw when fetch rejects', async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error('network error'));
    vi.stubGlobal('fetch', fetchSpy);
    const { sendHeartbeat } = await import('../api/surveys');
    // Should not throw
    await expect(sendHeartbeat('slug', 'v1', 'respondent')).resolves.toBeUndefined();
  });

  it('sends respondent type correctly', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);
    const { sendHeartbeat } = await import('../api/surveys');
    await sendHeartbeat('slug', 'v2', 'respondent');
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.type).toBe('respondent');
  });
});

describe('NPS score calculation', () => {
  it('returns null for empty answers', () => {
    const result = computeNps([]);
    expect(result.npsScore).toBeNull();
  });

  it('returns 100 when all promoters (scores 9-10)', () => {
    const answers = [
      { value: '9', count: 5 },
      { value: '10', count: 5 },
    ];
    const result = computeNps(answers);
    expect(result.npsScore).toBe(100);
    expect(result.promoters).toBe(10);
    expect(result.detractors).toBe(0);
  });

  it('returns -100 when all detractors (scores 0-6)', () => {
    const answers = [
      { value: '0', count: 3 },
      { value: '3', count: 3 },
      { value: '6', count: 4 },
    ];
    const result = computeNps(answers);
    expect(result.npsScore).toBe(-100);
    expect(result.detractors).toBe(10);
    expect(result.promoters).toBe(0);
  });

  it('returns 0 when promoters equal detractors', () => {
    const answers = [
      { value: '10', count: 5 },
      { value: '3', count: 5 },
    ];
    const result = computeNps(answers);
    expect(result.npsScore).toBe(0);
  });

  it('computes mixed score correctly', () => {
    // 30 promoters, 50 passives, 20 detractors → (30-20)/100 = 10
    const answers = [
      { value: '10', count: 30 },
      { value: '8', count: 50 },
      { value: '4', count: 20 },
    ];
    const result = computeNps(answers);
    expect(result.npsScore).toBe(10);
    expect(result.total).toBe(100);
  });

  it('classifies scores 7-8 as passives', () => {
    const answers = [
      { value: '7', count: 10 },
      { value: '8', count: 10 },
    ];
    const result = computeNps(answers);
    expect(result.passives).toBe(20);
    expect(result.promoters).toBe(0);
    expect(result.detractors).toBe(0);
    expect(result.npsScore).toBe(0);
  });

  it('ignores non-numeric values', () => {
    const answers = [
      { value: 'N/A', count: 5 },
      { value: '10', count: 10 },
    ];
    const result = computeNps(answers);
    expect(result.total).toBe(10);
    expect(result.npsScore).toBe(100);
  });

  it('rounds NPS score to nearest integer', () => {
    // 1 promoter, 2 detractors → (1-2)/3 ≈ -33.33 → -33
    const answers = [
      { value: '10', count: 1 },
      { value: '2', count: 2 },
    ];
    const result = computeNps(answers);
    expect(result.npsScore).toBe(-33);
  });
});

describe('NPS label', () => {
  it('returns empty for null', () => {
    expect(npsLabel(null)).toBe('');
  });

  it('returns Excellent for >= 50', () => {
    expect(npsLabel(50)).toBe('Excellent');
    expect(npsLabel(100)).toBe('Excellent');
  });

  it('returns Good for >= 0 and < 50', () => {
    expect(npsLabel(0)).toBe('Good');
    expect(npsLabel(49)).toBe('Good');
  });

  it('returns Needs improvement for >= -50 and < 0', () => {
    expect(npsLabel(-1)).toBe('Needs improvement');
    expect(npsLabel(-50)).toBe('Needs improvement');
  });

  it('returns Critical for < -50', () => {
    expect(npsLabel(-51)).toBe('Critical');
    expect(npsLabel(-100)).toBe('Critical');
  });
});

describe('Drop-off rate calculation', () => {
  it('returns 0 for 0 reached', () => {
    expect(computeDropoffRate(0, 0)).toBe(0);
  });

  it('returns 0 when all answered', () => {
    expect(computeDropoffRate(100, 100)).toBe(0);
  });

  it('returns 100 when none answered', () => {
    expect(computeDropoffRate(50, 0)).toBe(100);
  });

  it('computes correct rate for partial drop-off', () => {
    expect(computeDropoffRate(100, 80)).toBe(20);
  });

  it('rounds to nearest integer', () => {
    // (100 - 67) / 100 = 33%
    expect(computeDropoffRate(100, 67)).toBe(33);
  });

  it('matches the DropoffDataPoint interface shape', () => {
    const reached = 200;
    const answered = 150;
    const rate = computeDropoffRate(reached, answered);
    const dp: DropoffDataPoint = {
      questionId: 'q1',
      questionText: 'Question 1',
      respondentsReached: reached,
      respondentsAnswered: answered,
      dropoffRate: rate,
    };
    expect(dp.dropoffRate).toBe(25);
  });
});

describe('Chart data mapping', () => {
  it('sorts answers by count descending', () => {
    const answers: ChartAnswer[] = [
      { value: 'A', otherText: null, count: 5 },
      { value: 'B', otherText: null, count: 10 },
      { value: 'C', otherText: null, count: 3 },
    ];
    const data = toChartData(answers, 18);
    expect(data[0].label).toBe('B');
    expect(data[1].label).toBe('A');
    expect(data[2].label).toBe('C');
  });

  it('computes correct percentage', () => {
    const answers: ChartAnswer[] = [{ value: 'Yes', otherText: null, count: 25 }];
    const data = toChartData(answers, 100);
    expect(data[0].percentage).toBe(25);
  });

  it('returns 0 percentage when totalResponses is 0', () => {
    const answers: ChartAnswer[] = [{ value: 'Yes', otherText: null, count: 0 }];
    const data = toChartData(answers, 0);
    expect(data[0].percentage).toBe(0);
  });

  it('appends otherText to label when present', () => {
    const answers: ChartAnswer[] = [{ value: 'Other', otherText: 'custom response', count: 3 }];
    const data = toChartData(answers, 10);
    expect(data[0].label).toBe('Other: custom response');
  });

  it('does not append to label when otherText is null', () => {
    const answers: ChartAnswer[] = [{ value: 'Option A', otherText: null, count: 5 }];
    const data = toChartData(answers, 10);
    expect(data[0].label).toBe('Option A');
  });

  it('handles empty answers array', () => {
    const data = toChartData([], 0);
    expect(data).toEqual([]);
  });
});

describe('Word cloud data preparation', () => {
  it('transforms answers into word cloud format', () => {
    const answers: ChartAnswer[] = [
      { value: 'great experience', otherText: null, count: 5 },
      { value: 'needs work', otherText: null, count: 2 },
    ];
    const data = toWordCloudData(answers);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({ text: 'great experience', count: 5 });
    expect(data[1]).toEqual({ text: 'needs work', count: 2 });
  });

  it('sorts by count descending', () => {
    const answers: ChartAnswer[] = [
      { value: 'low', otherText: null, count: 1 },
      { value: 'high', otherText: null, count: 10 },
      { value: 'mid', otherText: null, count: 5 },
    ];
    const data = toWordCloudData(answers);
    expect(data[0].text).toBe('high');
    expect(data[1].text).toBe('mid');
    expect(data[2].text).toBe('low');
  });

  it('handles empty array', () => {
    expect(toWordCloudData([])).toEqual([]);
  });
});

describe('Filter bar - filterable question types', () => {
  it('includes radio, checkbox, dropdown, nps, rating, likert', () => {
    const questions: SurveyQuestion[] = [
      makeQuestion({ id: 'q1', type: 'radio' }),
      makeQuestion({ id: 'q2', type: 'checkbox' }),
      makeQuestion({ id: 'q3', type: 'dropdown' }),
      makeQuestion({ id: 'q4', type: 'nps' }),
      makeQuestion({ id: 'q5', type: 'rating' }),
      makeQuestion({ id: 'q6', type: 'likert' }),
    ];
    const result = filterableQuestions(questions);
    expect(result).toHaveLength(6);
  });

  it('excludes text types', () => {
    const questions: SurveyQuestion[] = [
      makeQuestion({ id: 'q1', type: 'text' }),
      makeQuestion({ id: 'q2', type: 'textarea' }),
      makeQuestion({ id: 'q3', type: 'email' }),
    ];
    const result = filterableQuestions(questions);
    expect(result).toHaveLength(0);
  });

  it('filters a mixed set correctly', () => {
    const questions: SurveyQuestion[] = [
      makeQuestion({ id: 'q1', type: 'radio' }),
      makeQuestion({ id: 'q2', type: 'text' }),
      makeQuestion({ id: 'q3', type: 'nps' }),
      makeQuestion({ id: 'q4', type: 'textarea' }),
      makeQuestion({ id: 'q5', type: 'dropdown' }),
      makeQuestion({ id: 'q6', type: 'email' }),
    ];
    const result = filterableQuestions(questions);
    expect(result.map((q) => q.id)).toEqual(['q1', 'q3', 'q5']);
  });

  it('excludes number type', () => {
    const questions: SurveyQuestion[] = [makeQuestion({ id: 'q1', type: 'number' })];
    const result = filterableQuestions(questions);
    expect(result).toHaveLength(0);
  });

  it('returns empty for empty input', () => {
    expect(filterableQuestions([])).toEqual([]);
  });
});

describe('Timeline data handling', () => {
  it('accepts day granularity data points', () => {
    const points: TimelineDataPoint[] = [
      { period: '2026-03-01', started: 10, completed: 8 },
      { period: '2026-03-02', started: 15, completed: 12 },
      { period: '2026-03-03', started: 20, completed: 18 },
    ];
    expect(points).toHaveLength(3);
    expect(points[0].period).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('accepts hour granularity data points', () => {
    const points: TimelineDataPoint[] = [
      { period: '2026-03-01T00:00:00Z', started: 2, completed: 1 },
      { period: '2026-03-01T01:00:00Z', started: 3, completed: 2 },
    ];
    expect(points).toHaveLength(2);
    expect(points[0].period).toContain('T');
  });

  it('handles empty timeline', () => {
    const points: TimelineDataPoint[] = [];
    expect(points).toHaveLength(0);
  });

  it('started is always >= completed', () => {
    const points: TimelineDataPoint[] = [
      { period: '2026-03-01', started: 10, completed: 10 },
      { period: '2026-03-02', started: 5, completed: 3 },
    ];
    for (const p of points) {
      expect(p.started).toBeGreaterThanOrEqual(p.completed);
    }
  });

  it('can compute completion rate from timeline data', () => {
    const point: TimelineDataPoint = { period: '2026-03-01', started: 100, completed: 75 };
    const completionRate = point.started > 0 ? (point.completed / point.started) * 100 : 0;
    expect(completionRate).toBe(75);
  });
});
