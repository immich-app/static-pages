import { describe, it, expect } from 'vitest';
import type { DropoffDataPoint } from '$lib/types';

// ── NPS computation (mirrors NpsScoreCard.svelte inline logic) ───────────

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
  const pPct = total > 0 ? (promoters / total) * 100 : 0;
  const paPct = total > 0 ? (passives / total) * 100 : 0;
  const dPct = total > 0 ? (detractors / total) * 100 : 0;
  return { total, promoters, passives, detractors, npsScore, pPct, paPct, dPct };
}

// ── Chart data mapping (mirrors QuestionResult.svelte inline logic) ──────

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

// ── Drop-off rate computation ────────────────────────────────────────────

function computeDropoffRate(reached: number, answered: number): number {
  if (reached === 0) return 0;
  return Math.round(((reached - answered) / reached) * 100);
}

// ═══════════════════════════════════════════════════════════════════════════
// NPS Score Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('NPS computation', () => {
  it('returns null score for empty input', () => {
    const result = computeNps([]);
    expect(result.npsScore).toBeNull();
    expect(result.total).toBe(0);
  });

  it('all promoters yields score of 100', () => {
    const answers: AnswerData[] = [
      { value: '9', count: 20 },
      { value: '10', count: 30 },
    ];
    const result = computeNps(answers);
    expect(result.npsScore).toBe(100);
    expect(result.promoters).toBe(50);
    expect(result.passives).toBe(0);
    expect(result.detractors).toBe(0);
    expect(result.pPct).toBe(100);
  });

  it('all detractors yields score of -100', () => {
    const answers: AnswerData[] = [
      { value: '0', count: 10 },
      { value: '1', count: 5 },
      { value: '4', count: 8 },
      { value: '6', count: 7 },
    ];
    const result = computeNps(answers);
    expect(result.npsScore).toBe(-100);
    expect(result.detractors).toBe(30);
    expect(result.dPct).toBe(100);
  });

  it('all passives yields score of 0', () => {
    const answers: AnswerData[] = [
      { value: '7', count: 15 },
      { value: '8', count: 25 },
    ];
    const result = computeNps(answers);
    expect(result.npsScore).toBe(0);
    expect(result.passives).toBe(40);
    expect(result.paPct).toBe(100);
  });

  it('equal promoters and detractors yields 0', () => {
    const answers: AnswerData[] = [
      { value: '10', count: 10 },
      { value: '2', count: 10 },
    ];
    const result = computeNps(answers);
    expect(result.npsScore).toBe(0);
  });

  it('mixed realistic distribution', () => {
    // 40 promoters, 35 passives, 25 detractors → (40-25)/100 = 15
    const answers: AnswerData[] = [
      { value: '10', count: 25 },
      { value: '9', count: 15 },
      { value: '8', count: 20 },
      { value: '7', count: 15 },
      { value: '5', count: 15 },
      { value: '3', count: 10 },
    ];
    const result = computeNps(answers);
    expect(result.total).toBe(100);
    expect(result.promoters).toBe(40);
    expect(result.passives).toBe(35);
    expect(result.detractors).toBe(25);
    expect(result.npsScore).toBe(15);
  });

  it('skips non-numeric values gracefully', () => {
    const answers: AnswerData[] = [
      { value: 'N/A', count: 3 },
      { value: 'skipped', count: 2 },
      { value: '10', count: 5 },
    ];
    const result = computeNps(answers);
    expect(result.total).toBe(5);
    expect(result.npsScore).toBe(100);
  });

  it('handles single response', () => {
    const result = computeNps([{ value: '5', count: 1 }]);
    expect(result.npsScore).toBe(-100);
    expect(result.total).toBe(1);
  });

  it('computes correct percentages for segmented bar', () => {
    const answers: AnswerData[] = [
      { value: '10', count: 1 }, // promoter
      { value: '8', count: 1 }, // passive
      { value: '3', count: 1 }, // detractor
    ];
    const result = computeNps(answers);
    expect(result.pPct).toBeCloseTo(33.33, 1);
    expect(result.paPct).toBeCloseTo(33.33, 1);
    expect(result.dPct).toBeCloseTo(33.33, 1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Chart Data Mapping Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Chart data mapping', () => {
  it('maps answers to bar chart data with labels, values, percentages', () => {
    const answers: ChartAnswer[] = [
      { value: 'Yes', otherText: null, count: 60 },
      { value: 'No', otherText: null, count: 40 },
    ];
    const data = toChartData(answers, 100);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({ label: 'Yes', value: 60, percentage: 60 });
    expect(data[1]).toEqual({ label: 'No', value: 40, percentage: 40 });
  });

  it('sorts by count descending', () => {
    const answers: ChartAnswer[] = [
      { value: 'Low', otherText: null, count: 2 },
      { value: 'High', otherText: null, count: 10 },
      { value: 'Mid', otherText: null, count: 5 },
    ];
    const data = toChartData(answers, 17);
    expect(data[0].label).toBe('High');
    expect(data[1].label).toBe('Mid');
    expect(data[2].label).toBe('Low');
  });

  it('includes otherText in label', () => {
    const answers: ChartAnswer[] = [
      { value: 'Other', otherText: 'user wrote this', count: 3 },
    ];
    const data = toChartData(answers, 10);
    expect(data[0].label).toBe('Other: user wrote this');
    expect(data[0].value).toBe(3);
    expect(data[0].percentage).toBe(30);
  });

  it('handles zero totalResponses without division error', () => {
    const answers: ChartAnswer[] = [
      { value: 'A', otherText: null, count: 0 },
    ];
    const data = toChartData(answers, 0);
    expect(data[0].percentage).toBe(0);
  });

  it('returns empty for empty answers', () => {
    expect(toChartData([], 50)).toEqual([]);
  });

  it('handles many answers correctly', () => {
    const answers: ChartAnswer[] = Array.from({ length: 20 }, (_, i) => ({
      value: `Option ${i}`,
      otherText: null,
      count: 20 - i,
    }));
    const data = toChartData(answers, 210);
    expect(data).toHaveLength(20);
    // First should have highest count
    expect(data[0].value).toBe(20);
    expect(data[19].value).toBe(1);
  });

  it('does not mutate original answers array', () => {
    const answers: ChartAnswer[] = [
      { value: 'B', otherText: null, count: 1 },
      { value: 'A', otherText: null, count: 5 },
    ];
    const originalOrder = answers.map((a) => a.value);
    toChartData(answers, 6);
    expect(answers.map((a) => a.value)).toEqual(originalOrder);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Drop-off Rate Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Drop-off rate calculations', () => {
  it('returns 0% when all answer', () => {
    expect(computeDropoffRate(100, 100)).toBe(0);
  });

  it('returns 100% when none answer', () => {
    expect(computeDropoffRate(50, 0)).toBe(100);
  });

  it('handles zero reached gracefully', () => {
    expect(computeDropoffRate(0, 0)).toBe(0);
  });

  it('computes 20% drop-off', () => {
    expect(computeDropoffRate(100, 80)).toBe(20);
  });

  it('computes 50% drop-off', () => {
    expect(computeDropoffRate(200, 100)).toBe(50);
  });

  it('rounds correctly', () => {
    // (30 - 19) / 30 = 0.3666... → 37%
    expect(computeDropoffRate(30, 19)).toBe(37);
  });

  it('works with real DropoffDataPoint pipeline', () => {
    const questions = [
      { id: 'q1', text: 'Name?', reached: 100, answered: 95 },
      { id: 'q2', text: 'Role?', reached: 95, answered: 80 },
      { id: 'q3', text: 'Feedback?', reached: 80, answered: 50 },
    ];

    const dataPoints: DropoffDataPoint[] = questions.map((q) => ({
      questionId: q.id,
      questionText: q.text,
      respondentsReached: q.reached,
      respondentsAnswered: q.answered,
      dropoffRate: computeDropoffRate(q.reached, q.answered),
    }));

    expect(dataPoints).toHaveLength(3);
    expect(dataPoints[0].dropoffRate).toBe(5);
    expect(dataPoints[1].dropoffRate).toBe(16);
    expect(dataPoints[2].dropoffRate).toBe(38);
  });

  it('identifies high drop-off questions (>30%)', () => {
    const dataPoints: DropoffDataPoint[] = [
      { questionId: 'q1', questionText: 'Easy', respondentsReached: 100, respondentsAnswered: 90, dropoffRate: 10 },
      { questionId: 'q2', questionText: 'Hard', respondentsReached: 90, respondentsAnswered: 50, dropoffRate: 44 },
      { questionId: 'q3', questionText: 'Medium', respondentsReached: 50, respondentsAnswered: 40, dropoffRate: 20 },
    ];
    const highDropoff = dataPoints.filter((d) => d.dropoffRate > 30);
    expect(highDropoff).toHaveLength(1);
    expect(highDropoff[0].questionId).toBe('q2');
  });
});
