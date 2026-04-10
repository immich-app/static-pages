export interface AnswerData {
  value: string;
  otherText?: string | null;
  count: number;
}

// ============================================================
// NPS
// ============================================================

export interface NpsStats {
  total: number;
  promoters: number;
  passives: number;
  detractors: number;
  npsScore: number | null;
  pPct: number;
  paPct: number;
  dPct: number;
}

export function computeNps(answers: AnswerData[]): NpsStats {
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

export function npsLabel(npsScore: number | null): string {
  if (npsScore === null) return '';
  if (npsScore >= 50) return 'Excellent';
  if (npsScore >= 0) return 'Good';
  if (npsScore >= -50) return 'Needs improvement';
  return 'Critical';
}

/** Distribution over all 11 NPS buckets (0-10) */
export function npsDistribution(answers: AnswerData[]): Array<{ score: number; count: number }> {
  const dist = Array.from({ length: 11 }, (_, i) => ({ score: i, count: 0 }));
  for (const a of answers) {
    const n = Number(a.value);
    if (Number.isInteger(n) && n >= 0 && n <= 10) dist[n].count += a.count;
  }
  return dist;
}

// ============================================================
// Rating (1-N stars)
// ============================================================

export interface RatingStats {
  total: number;
  mean: number | null;
  topBoxPct: number; // % rated at or near the max
  distribution: Array<{ star: number; count: number }>;
}

export function computeRating(answers: AnswerData[], scaleMax = 5): RatingStats {
  const distribution = Array.from({ length: scaleMax }, (_, i) => ({ star: i + 1, count: 0 }));
  let total = 0;
  let sum = 0;
  for (const a of answers) {
    const n = Number(a.value);
    if (Number.isInteger(n) && n >= 1 && n <= scaleMax) {
      distribution[n - 1].count += a.count;
      total += a.count;
      sum += n * a.count;
    }
  }
  const mean = total > 0 ? sum / total : null;
  // "Top box" = highest rating; we also count scaleMax - 1 as "top 2 box" when scaleMax >= 5
  const topBoxCount =
    scaleMax >= 5
      ? distribution[scaleMax - 1].count + distribution[scaleMax - 2].count
      : distribution[scaleMax - 1].count;
  const topBoxPct = total > 0 ? (topBoxCount / total) * 100 : 0;
  return { total, mean, topBoxPct, distribution };
}

// ============================================================
// Likert (5-point agreement)
// ============================================================

// Ordered from most negative to most positive. Used for diverging bar rendering.
export const LIKERT_VALUES = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] as const;

export interface LikertStats {
  total: number;
  counts: Record<(typeof LIKERT_VALUES)[number], number>;
  percents: Record<(typeof LIKERT_VALUES)[number], number>;
  agreePct: number; // agree + strongly agree
  disagreePct: number; // disagree + strongly disagree
  neutralPct: number;
  mean: number | null; // 1-5 where 5 = strongly agree
}

export function computeLikert(answers: AnswerData[]): LikertStats {
  const counts: Record<string, number> = {};
  for (const v of LIKERT_VALUES) counts[v] = 0;

  let total = 0;
  let sum = 0;
  for (const a of answers) {
    const idx = LIKERT_VALUES.indexOf(a.value as (typeof LIKERT_VALUES)[number]);
    if (idx >= 0) {
      counts[a.value] += a.count;
      total += a.count;
      sum += (idx + 1) * a.count;
    }
  }

  const percents: Record<string, number> = {};
  for (const v of LIKERT_VALUES) {
    percents[v] = total > 0 ? (counts[v] / total) * 100 : 0;
  }

  return {
    total,
    counts: counts as LikertStats['counts'],
    percents: percents as LikertStats['percents'],
    agreePct: percents['Agree'] + percents['Strongly Agree'],
    disagreePct: percents['Disagree'] + percents['Strongly Disagree'],
    neutralPct: percents['Neutral'],
    mean: total > 0 ? sum / total : null,
  };
}

// ============================================================
// Number (histogram + summary stats)
// ============================================================

export interface NumberStats {
  total: number;
  mean: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  values: number[]; // sorted, expanded by count
}

export function computeNumber(answers: AnswerData[]): NumberStats {
  const values: number[] = [];
  for (const a of answers) {
    const n = Number(a.value);
    if (Number.isFinite(n)) {
      for (let i = 0; i < a.count; i++) values.push(n);
    }
  }
  values.sort((a, b) => a - b);
  const total = values.length;
  if (total === 0) {
    return { total: 0, mean: null, median: null, min: null, max: null, values: [] };
  }
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / total;
  const median = total % 2 === 0 ? (values[total / 2 - 1] + values[total / 2]) / 2 : values[Math.floor(total / 2)];
  return {
    total,
    mean,
    median,
    min: values[0],
    max: values[total - 1],
    values,
  };
}

/**
 * Auto-bucket numeric values into ~10 bins using Sturges-like rules.
 * Returns [{ label, rangeStart, rangeEnd, count }].
 */
export interface NumberBucket {
  label: string;
  rangeStart: number;
  rangeEnd: number;
  count: number;
}

export function bucketNumbers(values: number[], maxBuckets = 10): NumberBucket[] {
  if (values.length === 0) return [];
  const min = values[0];
  const max = values[values.length - 1];
  if (min === max) {
    return [{ label: `${min}`, rangeStart: min, rangeEnd: min, count: values.length }];
  }
  // Integer-only data gets integer bins if the range is small
  const allIntegers = values.every((v) => Number.isInteger(v));
  const range = max - min;

  let bucketCount: number;
  let bucketSize: number;
  if (allIntegers && range < maxBuckets) {
    bucketCount = range + 1;
    bucketSize = 1;
  } else {
    bucketCount = Math.min(maxBuckets, Math.max(5, Math.ceil(Math.log2(values.length) + 1)));
    bucketSize = range / bucketCount;
  }

  const buckets: NumberBucket[] = Array.from({ length: bucketCount }, (_, i) => {
    const start = min + i * bucketSize;
    const end = i === bucketCount - 1 ? max : start + bucketSize;
    const label =
      allIntegers && bucketSize === 1 ? `${Math.round(start)}` : `${formatNumber(start)}–${formatNumber(end)}`;
    return { label, rangeStart: start, rangeEnd: end, count: 0 };
  });

  for (const v of values) {
    // last bucket is inclusive on both ends
    let idx: number;
    if (v === max) {
      idx = bucketCount - 1;
    } else {
      idx = Math.min(bucketCount - 1, Math.floor((v - min) / bucketSize));
    }
    buckets[idx].count++;
  }
  return buckets;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

// ============================================================
// Text (n-grams + length distribution)
// ============================================================

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'been',
  'by',
  'for',
  'from',
  'has',
  'have',
  'i',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'was',
  'were',
  'will',
  'with',
  "i'm",
  "it's",
  'but',
  'not',
  'so',
  'if',
  'we',
  'you',
  'they',
  'he',
  'she',
  'my',
  'your',
  'their',
  'me',
  'us',
  'them',
  'his',
  'her',
  'our',
  'do',
  'does',
  'did',
  'had',
  'would',
  'could',
  'should',
  'can',
  'just',
  'also',
  'all',
  'no',
  'yes',
  "don't",
  "doesn't",
  "didn't",
  'about',
  'what',
  'when',
  'where',
  'why',
  'how',
  'there',
  'here',
  'than',
  'then',
  'some',
  'any',
  'one',
  'two',
  'very',
  'more',
  'most',
  'much',
  'many',
  'really',
  'quite',
  'over',
  'out',
  'up',
  'down',
  'into',
  'only',
  'other',
  "isn't",
  "wasn't",
  "weren't",
  "aren't",
  "haven't",
  "hasn't",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

export interface NgramEntry {
  phrase: string;
  count: number;
}

/**
 * Compute top bigrams + trigrams from text responses, filtered against stopwords.
 * Much more useful than a word cloud because counts are explicit and phrases are preserved.
 */
export function computeNgrams(answers: AnswerData[], limit = 20): NgramEntry[] {
  const phrases = new Map<string, number>();

  for (const a of answers) {
    const tokens = tokenize(a.value);
    // bigrams
    for (let i = 0; i < tokens.length - 1; i++) {
      const p = `${tokens[i]} ${tokens[i + 1]}`;
      phrases.set(p, (phrases.get(p) ?? 0) + a.count);
    }
    // trigrams (weighted slightly so they show up alongside bigrams)
    for (let i = 0; i < tokens.length - 2; i++) {
      const p = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
      phrases.set(p, (phrases.get(p) ?? 0) + a.count);
    }
    // unigrams as fallback so short answers aren't invisible
    if (tokens.length < 2) {
      for (const t of tokens) {
        phrases.set(t, (phrases.get(t) ?? 0) + a.count);
      }
    }
  }

  return [...phrases.entries()]
    .map(([phrase, count]) => ({ phrase, count }))
    .filter((e) => e.count >= 2 || e.phrase.split(' ').length === 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface TextStats {
  total: number;
  totalChars: number;
  avgLength: number;
  shortCount: number; // < 10 chars
  longCount: number; // > 100 chars
  blankCount: number;
}

export function computeTextStats(answers: AnswerData[]): TextStats {
  let total = 0,
    totalChars = 0,
    shortCount = 0,
    longCount = 0,
    blankCount = 0;
  for (const a of answers) {
    const trimmed = a.value.trim();
    total += a.count;
    totalChars += trimmed.length * a.count;
    if (trimmed.length === 0) blankCount += a.count;
    else if (trimmed.length < 10) shortCount += a.count;
    else if (trimmed.length > 100) longCount += a.count;
  }
  return {
    total,
    totalChars,
    avgLength: total > 0 ? Math.round(totalChars / total) : 0,
    shortCount,
    longCount,
    blankCount,
  };
}

// ============================================================
// Email analysis
// ============================================================

/**
 * Known disposable / throwaway email providers. These are strong bot signals
 * and almost never represent a real lead.
 */
export const DISPOSABLE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'throwaway.email',
  'trashmail.com',
  'yopmail.com',
  'getnada.com',
  'maildrop.cc',
  'sharklasers.com',
  'dispostable.com',
  'fakeinbox.com',
  'tempmailaddress.com',
  'mohmal.com',
  'emailondeck.com',
  'temp-mail.org',
  'mintemail.com',
  'spamgourmet.com',
  'mailnesia.com',
  'inboxkitten.com',
  'tempmail.net',
  'mytemp.email',
  'tempinbox.com',
  'throwawaymail.com',
  'trbvm.com',
]);

/**
 * Free consumer email providers. Anything not in this set and not disposable
 * is treated as a "corporate" / custom-domain address.
 */
export const FREE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'hotmail.co.uk',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.co.jp',
  'ymail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'gmx.com',
  'gmx.net',
  'zoho.com',
  'yandex.com',
  'yandex.ru',
  'mail.com',
  'fastmail.com',
  'tutanota.com',
  'hey.com',
]);

/**
 * Email local-parts that indicate a role-based mailbox rather than a human.
 */
export const ROLE_EMAIL_PREFIXES: ReadonlySet<string> = new Set([
  'admin',
  'administrator',
  'info',
  'contact',
  'hello',
  'hi',
  'support',
  'help',
  'sales',
  'marketing',
  'noreply',
  'no-reply',
  'donotreply',
  'do-not-reply',
  'postmaster',
  'webmaster',
  'root',
  'abuse',
  'billing',
  'office',
  'team',
  'enquiries',
  'inquiries',
  'mail',
  'feedback',
]);

export type EmailKind = 'corporate' | 'free' | 'disposable';

/**
 * Normalize an email address for duplicate detection:
 *   - lowercase, trimmed
 *   - gmail/googlemail: strip dots and "+tag" suffixes from the local part
 *
 * Returns null if the value doesn't parse as an email.
 */
export function normalizeEmail(raw: string): { normalized: string; local: string; domain: string } | null {
  const trimmed = raw.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at >= trimmed.length - 1) return null;
  let local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return null;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const plus = local.indexOf('+');
    if (plus >= 0) local = local.slice(0, plus);
    local = local.replaceAll('.', '');
  }
  return { normalized: `${local}@${domain}`, local, domain };
}

export function classifyDomain(domain: string): EmailKind {
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return 'disposable';
  if (FREE_EMAIL_DOMAINS.has(domain)) return 'free';
  return 'corporate';
}

export interface EmailEntry {
  /** Original casing as submitted (first seen). */
  raw: string;
  /** Normalized form used for dedupe. */
  normalized: string;
  local: string;
  domain: string;
  kind: EmailKind;
  isRoleBased: boolean;
  /** How many respondents submitted this (deduped) address. */
  count: number;
}

export interface EmailSummary {
  total: number;
  unique: number;
  duplicates: number;
  disposableCount: number;
  freeCount: number;
  corporateCount: number;
  roleBasedCount: number;
  invalidCount: number;
  topDomains: Array<{ domain: string; count: number; kind: EmailKind }>;
  entries: EmailEntry[];
}

export function computeEmailSummary(answers: AnswerData[]): EmailSummary {
  const byNormalized = new Map<string, EmailEntry>();
  const domains = new Map<string, number>();
  let total = 0;
  let invalidCount = 0;

  for (const a of answers) {
    total += a.count;
    const parsed = normalizeEmail(a.value);
    if (!parsed) {
      invalidCount += a.count;
      continue;
    }
    const { normalized, local, domain } = parsed;
    let entry = byNormalized.get(normalized);
    if (!entry) {
      entry = {
        raw: a.value.trim(),
        normalized,
        local,
        domain,
        kind: classifyDomain(domain),
        isRoleBased: ROLE_EMAIL_PREFIXES.has(local),
        count: 0,
      };
      byNormalized.set(normalized, entry);
    }
    entry.count += a.count;
    domains.set(domain, (domains.get(domain) ?? 0) + a.count);
  }

  const entries = [...byNormalized.values()].sort(
    (a, b) => b.count - a.count || a.normalized.localeCompare(b.normalized),
  );

  let disposableCount = 0;
  let freeCount = 0;
  let corporateCount = 0;
  let roleBasedCount = 0;
  for (const e of entries) {
    if (e.kind === 'disposable') disposableCount += e.count;
    else if (e.kind === 'free') freeCount += e.count;
    else corporateCount += e.count;
    if (e.isRoleBased) roleBasedCount += e.count;
  }

  const topDomains = [...domains.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([domain, count]) => ({ domain, count, kind: classifyDomain(domain) }));

  return {
    total,
    unique: entries.length,
    duplicates: total - entries.length - invalidCount,
    disposableCount,
    freeCount,
    corporateCount,
    roleBasedCount,
    invalidCount,
    topDomains,
    entries,
  };
}

/**
 * Legacy alias — TextResult still uses this shape. Prefer `computeEmailSummary`
 * for new code; this wraps it and exposes just the fields the old call sites
 * need.
 */
export interface EmailStats {
  total: number;
  unique: number;
  duplicates: number;
  topDomains: Array<{ domain: string; count: number }>;
}

export function computeEmailStats(answers: AnswerData[]): EmailStats {
  const s = computeEmailSummary(answers);
  return {
    total: s.total,
    unique: s.unique,
    duplicates: s.duplicates,
    topDomains: s.topDomains.map(({ domain, count }) => ({ domain, count })),
  };
}

// ============================================================
// Choice-question helpers
// ============================================================

/**
 * For checkbox questions, answers are stored as comma-separated values per respondent.
 * Expand them into per-option counts and return the number of respondents who selected
 * at least one option (denominator for "% of respondents" calculations).
 */
export interface CheckboxStats {
  total: number; // number of respondents
  totalSelections: number; // sum across all selections
  avgSelections: number;
  perOption: Array<{ value: string; count: number; percent: number }>;
}

export function computeCheckboxStats(answers: AnswerData[]): CheckboxStats {
  // answers[n].value is a comma-separated string; count is the number of respondents
  // whose selection was exactly that combination.
  const perOption = new Map<string, number>();
  let total = 0;
  let totalSelections = 0;

  for (const a of answers) {
    total += a.count;
    const picks = a.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    totalSelections += picks.length * a.count;
    for (const p of picks) {
      perOption.set(p, (perOption.get(p) ?? 0) + a.count);
    }
  }

  const perOptionArr = [...perOption.entries()]
    .map(([value, count]) => ({
      value,
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    total,
    totalSelections,
    avgSelections: total > 0 ? totalSelections / total : 0,
    perOption: perOptionArr,
  };
}

// ============================================================
// Legacy helper (used elsewhere)
// ============================================================

export function computeDropoffRate(reached: number, answered: number): number {
  if (reached === 0) return 0;
  return Math.round(((reached - answered) / reached) * 100);
}

// ============================================================
// Low-sample threshold
// ============================================================

export const LOW_SAMPLE_THRESHOLD = 5;
export const NPS_MIN_SAMPLE = 10;
