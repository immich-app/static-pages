import { describe, it, expect } from 'vitest';
import {
  bucketNumbers,
  classifyDomain,
  computeCheckboxStats,
  computeEmailSummary,
  computeLikert,
  computeNgrams,
  computeNumber,
  computeRating,
  computeTextStats,
  DISPOSABLE_EMAIL_DOMAINS,
  FREE_EMAIL_DOMAINS,
  LIKERT_VALUES,
  normalizeEmail,
  ROLE_EMAIL_PREFIXES,
  type AnswerData,
} from './analytics-utils';

// ═══════════════════════════════════════════════════════════════════════════
// Email normalization + classification
// ═══════════════════════════════════════════════════════════════════════════

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmail('  JOHN@Example.COM  ')).toEqual({
      normalized: 'john@example.com',
      local: 'john',
      domain: 'example.com',
    });
  });

  it('strips dots and +tags for gmail', () => {
    expect(normalizeEmail('j.ohn.doe+newsletter@gmail.com')).toEqual({
      normalized: 'johndoe@gmail.com',
      local: 'johndoe',
      domain: 'gmail.com',
    });
  });

  it('strips dots and +tags for googlemail', () => {
    expect(normalizeEmail('john.doe+shop@googlemail.com')).toEqual({
      normalized: 'johndoe@googlemail.com',
      local: 'johndoe',
      domain: 'googlemail.com',
    });
  });

  it('does NOT strip dots for non-gmail providers', () => {
    expect(normalizeEmail('j.ohn@outlook.com')).toEqual({
      normalized: 'j.ohn@outlook.com',
      local: 'j.ohn',
      domain: 'outlook.com',
    });
  });

  it('rejects inputs without @', () => {
    expect(normalizeEmail('johnexample.com')).toBeNull();
  });

  it('rejects inputs with empty local part', () => {
    expect(normalizeEmail('@example.com')).toBeNull();
  });

  it('rejects inputs with empty domain', () => {
    expect(normalizeEmail('john@')).toBeNull();
  });

  it('rejects domains without a TLD', () => {
    expect(normalizeEmail('john@example')).toBeNull();
  });

  it('accepts multi-level TLDs', () => {
    expect(normalizeEmail('jane@company.co.uk')?.domain).toBe('company.co.uk');
  });
});

describe('classifyDomain', () => {
  it('detects disposable providers', () => {
    expect(classifyDomain('mailinator.com')).toBe('disposable');
    expect(classifyDomain('tempmail.com')).toBe('disposable');
  });

  it('detects free consumer providers', () => {
    expect(classifyDomain('gmail.com')).toBe('free');
    expect(classifyDomain('icloud.com')).toBe('free');
    expect(classifyDomain('protonmail.com')).toBe('free');
  });

  it('treats unknown domains as corporate', () => {
    expect(classifyDomain('immich.app')).toBe('corporate');
    expect(classifyDomain('acme.io')).toBe('corporate');
  });

  it('disposable list and free list are disjoint', () => {
    for (const d of DISPOSABLE_EMAIL_DOMAINS) {
      expect(FREE_EMAIL_DOMAINS.has(d)).toBe(false);
    }
  });

  it('role prefixes list is populated', () => {
    expect(ROLE_EMAIL_PREFIXES.has('admin')).toBe(true);
    expect(ROLE_EMAIL_PREFIXES.has('support')).toBe(true);
    expect(ROLE_EMAIL_PREFIXES.has('noreply')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Email summary
// ═══════════════════════════════════════════════════════════════════════════

describe('computeEmailSummary', () => {
  it('returns empty summary for empty input', () => {
    const s = computeEmailSummary([]);
    expect(s.total).toBe(0);
    expect(s.unique).toBe(0);
    expect(s.duplicates).toBe(0);
    expect(s.entries).toEqual([]);
  });

  it('dedupes gmail variants into a single entry', () => {
    const answers: AnswerData[] = [
      { value: 'john.doe@gmail.com', count: 1 },
      { value: 'johndoe+newsletter@gmail.com', count: 1 },
      { value: 'JOHNDOE@gmail.com', count: 1 },
    ];
    const s = computeEmailSummary(answers);
    expect(s.total).toBe(3);
    expect(s.unique).toBe(1);
    expect(s.duplicates).toBe(2);
    expect(s.entries).toHaveLength(1);
    expect(s.entries[0].count).toBe(3);
  });

  it('counts disposable, free, and corporate buckets', () => {
    const answers: AnswerData[] = [
      { value: 'alice@gmail.com', count: 1 },
      { value: 'bob@yahoo.com', count: 1 },
      { value: 'carol@immich.app', count: 1 },
      { value: 'dave@mailinator.com', count: 1 },
      { value: 'eve@tempmail.com', count: 1 },
    ];
    const s = computeEmailSummary(answers);
    expect(s.freeCount).toBe(2);
    expect(s.corporateCount).toBe(1);
    expect(s.disposableCount).toBe(2);
  });

  it('flags role-based addresses', () => {
    const answers: AnswerData[] = [
      { value: 'admin@acme.io', count: 1 },
      { value: 'alice@acme.io', count: 1 },
      { value: 'support@acme.io', count: 2 },
    ];
    const s = computeEmailSummary(answers);
    expect(s.roleBasedCount).toBe(3); // admin (1) + support (2)
    expect(s.entries.find((e) => e.local === 'admin')?.isRoleBased).toBe(true);
    expect(s.entries.find((e) => e.local === 'alice')?.isRoleBased).toBe(false);
  });

  it('tracks invalid entries separately from counts', () => {
    const answers: AnswerData[] = [
      { value: 'valid@gmail.com', count: 2 },
      { value: 'not-an-email', count: 3 },
    ];
    const s = computeEmailSummary(answers);
    expect(s.total).toBe(5);
    expect(s.invalidCount).toBe(3);
    expect(s.unique).toBe(1);
    // duplicates = total - unique - invalid = 5 - 1 - 3 = 1
    expect(s.duplicates).toBe(1);
  });

  it('ranks top domains and tags each with its kind', () => {
    const answers: AnswerData[] = [
      { value: 'a@gmail.com', count: 10 },
      { value: 'b@gmail.com', count: 5 },
      { value: 'c@immich.app', count: 3 },
      { value: 'd@mailinator.com', count: 1 },
    ];
    const s = computeEmailSummary(answers);
    expect(s.topDomains[0]).toMatchObject({ domain: 'gmail.com', count: 15, kind: 'free' });
    expect(s.topDomains[1]).toMatchObject({ domain: 'immich.app', count: 3, kind: 'corporate' });
    expect(s.topDomains[2]).toMatchObject({ domain: 'mailinator.com', count: 1, kind: 'disposable' });
  });

  it('sorts entries by count desc, then alphabetically', () => {
    const answers: AnswerData[] = [
      { value: 'zeta@gmail.com', count: 1 },
      { value: 'alpha@gmail.com', count: 1 },
      { value: 'popular@gmail.com', count: 5 },
    ];
    const s = computeEmailSummary(answers);
    expect(s.entries.map((e) => e.local)).toEqual(['popular', 'alpha', 'zeta']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// N-grams
// ═══════════════════════════════════════════════════════════════════════════

describe('computeNgrams', () => {
  it('returns empty array for empty input', () => {
    expect(computeNgrams([])).toEqual([]);
  });

  it('surfaces repeated bigrams', () => {
    const answers: AnswerData[] = [
      { value: 'great product loved it', count: 1 },
      { value: 'amazing great product really', count: 1 },
    ];
    const grams = computeNgrams(answers);
    const phrases = grams.map((g) => g.phrase);
    expect(phrases).toContain('great product');
    const greatProduct = grams.find((g) => g.phrase === 'great product');
    expect(greatProduct?.count).toBe(2);
  });

  it('filters stopwords from tokens', () => {
    const answers: AnswerData[] = [
      { value: 'it is the best', count: 1 },
      { value: 'it is the best', count: 1 },
    ];
    const grams = computeNgrams(answers);
    // "it", "is", "the" are stopwords — only "best" is a single token
    // and single-token unigrams are only returned when the total token
    // count is < 2 — here there is only one token, so it fits.
    expect(grams.every((g) => !g.phrase.includes('the'))).toBe(true);
  });

  it('weights by answer count', () => {
    const answers: AnswerData[] = [{ value: 'fast delivery always', count: 10 }];
    const grams = computeNgrams(answers);
    const fastDelivery = grams.find((g) => g.phrase === 'fast delivery');
    expect(fastDelivery?.count).toBe(10);
  });

  it('respects the limit parameter', () => {
    const answers: AnswerData[] = [{ value: 'alpha beta gamma delta epsilon zeta eta theta iota kappa', count: 3 }];
    const grams = computeNgrams(answers, 5);
    expect(grams.length).toBeLessThanOrEqual(5);
  });

  it('drops bigrams with count < 2 unless they are unigrams', () => {
    const answers: AnswerData[] = [{ value: 'unique quirky phrase', count: 1 }];
    const grams = computeNgrams(answers);
    // All bigrams/trigrams in this sentence occur exactly once and should be
    // filtered out, leaving at most empty output.
    expect(grams.every((g) => g.count >= 2 || g.phrase.split(' ').length === 1)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Text stats
// ═══════════════════════════════════════════════════════════════════════════

describe('computeTextStats', () => {
  it('returns zeros for empty input', () => {
    const s = computeTextStats([]);
    expect(s.total).toBe(0);
    expect(s.avgLength).toBe(0);
  });

  it('computes average length weighted by count', () => {
    const answers: AnswerData[] = [
      { value: 'hi', count: 1 }, // 2 chars × 1 = 2
      { value: 'hello world', count: 3 }, // 11 chars × 3 = 33
    ];
    const s = computeTextStats(answers);
    expect(s.total).toBe(4);
    expect(s.totalChars).toBe(35);
    // 35 / 4 = 8.75 → rounds to 9
    expect(s.avgLength).toBe(9);
  });

  it('counts blank, short and long buckets', () => {
    const answers: AnswerData[] = [
      { value: '   ', count: 2 }, // blank
      { value: 'hi', count: 1 }, // short (<10)
      { value: 'a'.repeat(50), count: 1 }, // medium (not counted)
      { value: 'a'.repeat(150), count: 3 }, // long (>100)
    ];
    const s = computeTextStats(answers);
    expect(s.blankCount).toBe(2);
    expect(s.shortCount).toBe(1);
    expect(s.longCount).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Checkbox stats
// ═══════════════════════════════════════════════════════════════════════════

describe('computeCheckboxStats', () => {
  it('splits comma-separated combinations into per-option counts', () => {
    const answers: AnswerData[] = [
      { value: 'a,b', count: 5 },
      { value: 'a,c', count: 3 },
      { value: 'b', count: 2 },
    ];
    const s = computeCheckboxStats(answers);
    expect(s.total).toBe(10); // 5+3+2 respondents
    expect(s.totalSelections).toBe(5 * 2 + 3 * 2 + 2); // 18
    const byOption = Object.fromEntries(s.perOption.map((o) => [o.value, o.count]));
    expect(byOption).toEqual({ a: 8, b: 7, c: 3 });
  });

  it('computes average selections per respondent', () => {
    const answers: AnswerData[] = [
      { value: 'a,b,c', count: 4 },
      { value: 'a', count: 2 },
    ];
    const s = computeCheckboxStats(answers);
    // 6 respondents, 14 total selections (4×3 + 2×1) → 2.33
    expect(s.total).toBe(6);
    expect(s.totalSelections).toBe(14);
    expect(s.avgSelections).toBeCloseTo(14 / 6);
  });

  it('sorts per-option by count desc', () => {
    const answers: AnswerData[] = [{ value: 'alpha,beta,gamma', count: 1 }];
    const s = computeCheckboxStats(answers);
    // Tie-broken by insertion order
    expect(s.perOption.map((p) => p.value)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('computes percent of respondents who chose each option', () => {
    const answers: AnswerData[] = [
      { value: 'a', count: 3 },
      { value: 'b', count: 1 },
    ];
    const s = computeCheckboxStats(answers);
    const a = s.perOption.find((o) => o.value === 'a');
    expect(a?.percent).toBe(75); // 3 of 4 respondents
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Rating
// ═══════════════════════════════════════════════════════════════════════════

describe('computeRating', () => {
  it('returns null mean for empty input', () => {
    const s = computeRating([]);
    expect(s.total).toBe(0);
    expect(s.mean).toBeNull();
  });

  it('computes mean and top-2-box for a 5-point scale', () => {
    const answers: AnswerData[] = [
      { value: '5', count: 30 },
      { value: '4', count: 20 },
      { value: '3', count: 10 },
      { value: '2', count: 5 },
      { value: '1', count: 5 },
    ];
    const s = computeRating(answers, 5);
    expect(s.total).toBe(70);
    // (30×5 + 20×4 + 10×3 + 5×2 + 5×1) / 70 = 275/70 ≈ 3.93
    expect(s.mean).toBeCloseTo(275 / 70, 2);
    // Top box = 4s + 5s = 50 of 70 ≈ 71.4%
    expect(s.topBoxPct).toBeCloseTo((50 / 70) * 100, 2);
  });

  it('clamps out-of-range values', () => {
    const answers: AnswerData[] = [
      { value: '0', count: 1 }, // invalid
      { value: '6', count: 1 }, // invalid
      { value: '5', count: 1 },
    ];
    const s = computeRating(answers, 5);
    expect(s.total).toBe(1);
    expect(s.mean).toBe(5);
  });

  it('handles a 10-point scale', () => {
    const answers: AnswerData[] = [
      { value: '10', count: 5 },
      { value: '9', count: 5 },
      { value: '1', count: 5 },
    ];
    const s = computeRating(answers, 10);
    expect(s.total).toBe(15);
    // Top-2-box = 9s + 10s
    expect(s.topBoxPct).toBeCloseTo((10 / 15) * 100, 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Likert
// ═══════════════════════════════════════════════════════════════════════════

describe('computeLikert', () => {
  it('returns zero counts for empty input', () => {
    const s = computeLikert([]);
    expect(s.total).toBe(0);
    expect(s.mean).toBeNull();
    for (const v of LIKERT_VALUES) {
      expect(s.counts[v]).toBe(0);
    }
  });

  it('splits counts into agree/disagree/neutral', () => {
    const answers: AnswerData[] = [
      { value: 'Strongly Agree', count: 10 },
      { value: 'Agree', count: 5 },
      { value: 'Neutral', count: 3 },
      { value: 'Disagree', count: 2 },
      { value: 'Strongly Disagree', count: 1 },
    ];
    const s = computeLikert(answers);
    expect(s.total).toBe(21);
    expect(s.agreePct).toBeCloseTo(((10 + 5) / 21) * 100, 2);
    expect(s.disagreePct).toBeCloseTo(((2 + 1) / 21) * 100, 2);
    expect(s.neutralPct).toBeCloseTo((3 / 21) * 100, 2);
  });

  it('ignores non-likert values', () => {
    const answers: AnswerData[] = [
      { value: 'Agree', count: 5 },
      { value: 'Maybe', count: 100 }, // garbage
    ];
    const s = computeLikert(answers);
    expect(s.total).toBe(5);
  });

  it('computes mean on a 1-5 scale where 5 = strongly agree', () => {
    const answers: AnswerData[] = [
      { value: 'Strongly Agree', count: 2 },
      { value: 'Agree', count: 2 },
    ];
    const s = computeLikert(answers);
    // Strongly Agree=5, Agree=4 → (2*5 + 2*4) / 4 = 4.5
    expect(s.mean).toBe(4.5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Number stats + buckets
// ═══════════════════════════════════════════════════════════════════════════

describe('computeNumber', () => {
  it('returns nulls for empty input', () => {
    const s = computeNumber([]);
    expect(s.total).toBe(0);
    expect(s.mean).toBeNull();
    expect(s.median).toBeNull();
    expect(s.min).toBeNull();
    expect(s.max).toBeNull();
  });

  it('computes mean/median/min/max for odd-sized samples', () => {
    const answers: AnswerData[] = [
      { value: '5', count: 1 },
      { value: '1', count: 1 },
      { value: '3', count: 1 },
    ];
    const s = computeNumber(answers);
    expect(s.total).toBe(3);
    expect(s.mean).toBe(3);
    expect(s.median).toBe(3);
    expect(s.min).toBe(1);
    expect(s.max).toBe(5);
  });

  it('computes median as mean of middle two for even-sized samples', () => {
    const answers: AnswerData[] = [
      { value: '1', count: 1 },
      { value: '2', count: 1 },
      { value: '3', count: 1 },
      { value: '4', count: 1 },
    ];
    const s = computeNumber(answers);
    expect(s.median).toBe(2.5);
  });

  it('expands values by count', () => {
    const answers: AnswerData[] = [
      { value: '10', count: 3 },
      { value: '20', count: 2 },
    ];
    const s = computeNumber(answers);
    expect(s.total).toBe(5);
    expect(s.mean).toBe(14); // (30 + 40) / 5
  });

  it('ignores non-numeric values', () => {
    const answers: AnswerData[] = [
      { value: '42', count: 1 },
      { value: 'not a number', count: 5 },
    ];
    const s = computeNumber(answers);
    expect(s.total).toBe(1);
    expect(s.mean).toBe(42);
  });
});

describe('bucketNumbers', () => {
  it('returns [] for empty input', () => {
    expect(bucketNumbers([])).toEqual([]);
  });

  it('returns a single bucket when all values are equal', () => {
    const b = bucketNumbers([7, 7, 7]);
    expect(b).toHaveLength(1);
    expect(b[0].count).toBe(3);
    expect(b[0].label).toBe('7');
  });

  it('uses one integer bucket per value when the range is small', () => {
    const values = [1, 1, 2, 3, 3, 3, 4];
    const b = bucketNumbers(values);
    expect(b).toHaveLength(4);
    const byLabel = Object.fromEntries(b.map((x) => [x.label, x.count]));
    expect(byLabel).toEqual({ '1': 2, '2': 1, '3': 3, '4': 1 });
  });

  it('places every value into exactly one bucket', () => {
    const values = Array.from({ length: 100 }, (_, i) => i);
    const buckets = bucketNumbers(values);
    const total = buckets.reduce((acc, b) => acc + b.count, 0);
    expect(total).toBe(values.length);
  });

  it('includes the maximum value in the last bucket', () => {
    const values = Array.from({ length: 100 }, (_, i) => i);
    const buckets = bucketNumbers(values);
    const last = buckets[buckets.length - 1];
    expect(last.rangeEnd).toBe(99);
    expect(last.count).toBeGreaterThan(0);
  });
});
