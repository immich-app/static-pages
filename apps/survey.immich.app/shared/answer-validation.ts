/**
 * Shared answer validation — imported by both the client (QuestionCard) and
 * the server (ws-handler, respondent.service). A single source of truth for
 * what constitutes a valid answer to each question type.
 *
 * Returns null if valid, or a human-readable error string.
 */

const LIKERT_VALUES = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

export interface QuestionSpec {
  type: string;
  required: boolean;
  options?: Array<{ value: string }>;
  hasOther?: boolean;
  maxLength?: number;
  config?: {
    // Number
    min?: number;
    max?: number;
    integerOnly?: boolean;
    step?: number;
    // Rating
    scaleMax?: number;
    // Text / textarea
    minLength?: number;
    pattern?: string;
    patternError?: string;
    minWords?: number;
    maxWords?: number;
    // Checkbox
    minSelections?: number;
    maxSelections?: number;
    // Email
    allowedDomains?: string[];
  };
}

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function validateAnswer(question: QuestionSpec, value: string, otherText?: string): string | null {
  const trimmed = value.trim();
  const cfg = question.config ?? {};

  // ── Required check (all types) ──────────────────────────────────────
  if (question.required && trimmed === '') {
    return 'This question is required';
  }
  if (trimmed === '') return null; // optional + empty → valid

  // ── Per-type validation ─────────────────────────────────────────────
  switch (question.type) {
    case 'text':
    case 'textarea':
      return validateText(trimmed, question, cfg);

    case 'email':
      return validateEmail(trimmed, cfg);

    case 'number':
      return validateNumber(trimmed, cfg);

    case 'rating':
      return validateRating(trimmed, cfg);

    case 'nps':
      return validateNps(trimmed);

    case 'likert':
      return LIKERT_VALUES.includes(trimmed) ? null : 'Please select a valid option';

    case 'radio':
      return validateRadio(trimmed, question, otherText);

    case 'checkbox':
      return validateCheckbox(trimmed, question, otherText, cfg);

    case 'dropdown':
      return validateDropdown(trimmed, question);

    default:
      return null;
  }
}

// ── Text / textarea ─────────────────────────────────────────────────────

function validateText(value: string, question: QuestionSpec, cfg: NonNullable<QuestionSpec['config']>): string | null {
  const maxLen = question.maxLength;
  if (cfg.minLength !== undefined && value.length < cfg.minLength) {
    return `Must be at least ${cfg.minLength} characters`;
  }
  if (maxLen !== undefined && value.length > maxLen) {
    return `Must be at most ${maxLen} characters`;
  }
  if (cfg.minWords !== undefined && wordCount(value) < cfg.minWords) {
    return `Must be at least ${cfg.minWords} words`;
  }
  if (cfg.maxWords !== undefined && wordCount(value) > cfg.maxWords) {
    return `Must be at most ${cfg.maxWords} words`;
  }
  if (cfg.pattern) {
    try {
      if (!new RegExp(cfg.pattern).test(value)) {
        return cfg.patternError ?? 'Answer does not match the required format';
      }
    } catch {
      // Invalid regex in config — skip the check rather than blocking the user
    }
  }
  return null;
}

// ── Email ───────────────────────────────────────────────────────────────

function validateEmail(value: string, cfg: NonNullable<QuestionSpec['config']>): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Please enter a valid email address';
  }
  if (cfg.allowedDomains && cfg.allowedDomains.length > 0) {
    const domain = value.split('@')[1]?.toLowerCase();
    const allowed = cfg.allowedDomains.map((d) => d.toLowerCase());
    if (!allowed.includes(domain)) {
      return `Email must be from: ${cfg.allowedDomains.join(', ')}`;
    }
  }
  return null;
}

// ── Number ──────────────────────────────────────────────────────────────

function validateNumber(value: string, cfg: NonNullable<QuestionSpec['config']>): string | null {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 'Please enter a valid number';
  }
  if (cfg.integerOnly && !Number.isInteger(n)) {
    return 'Please enter a whole number';
  }
  if (cfg.min !== undefined && n < cfg.min) {
    return `Must be at least ${cfg.min}`;
  }
  if (cfg.max !== undefined && n > cfg.max) {
    return `Must be at most ${cfg.max}`;
  }
  if (cfg.step !== undefined && cfg.step > 0) {
    const base = cfg.min ?? 0;
    const remainder = Math.abs((n - base) % cfg.step);
    if (remainder > 1e-9 && Math.abs(remainder - cfg.step) > 1e-9) {
      return `Must be a multiple of ${cfg.step}`;
    }
  }
  return null;
}

// ── Rating ──────────────────────────────────────────────────────────────

function validateRating(value: string, cfg: NonNullable<QuestionSpec['config']>): string | null {
  const n = Number(value);
  const scaleMax = cfg.scaleMax ?? 5;
  if (!Number.isInteger(n) || n < 1 || n > scaleMax) {
    return 'Please select a rating';
  }
  return null;
}

// ── NPS ─────────────────────────────────────────────────────────────────

function validateNps(value: string): string | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 10) {
    return 'Please select a score from 0 to 10';
  }
  return null;
}

// ── Radio ───────────────────────────────────────────────────────────────

function validateRadio(value: string, question: QuestionSpec, otherText?: string): string | null {
  const validValues = new Set((question.options ?? []).map((o) => o.value));
  if (question.hasOther) validValues.add('Other');
  if (!validValues.has(value)) {
    return 'Please select a valid option';
  }
  if (value === 'Other' && question.hasOther && (!otherText || otherText.trim() === '')) {
    return 'Please specify your answer';
  }
  return null;
}

// ── Checkbox ────────────────────────────────────────────────────────────

function validateCheckbox(
  value: string,
  question: QuestionSpec,
  otherText: string | undefined,
  cfg: NonNullable<QuestionSpec['config']>,
): string | null {
  const selected = value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  // The top-level required check uses String.trim() which preserves commas,
  // so a value of "," (or ", , ,") survives that gate even though it
  // represents zero real selections. Re-check required here against the
  // actually-selected count.
  if (selected.length === 0) {
    return question.required ? 'This question is required' : null;
  }

  const validValues = new Set((question.options ?? []).map((o) => o.value));
  if (question.hasOther) validValues.add('Other');
  for (const v of selected) {
    if (!validValues.has(v)) {
      return `Invalid selection: ${v}`;
    }
  }

  if (cfg.minSelections !== undefined && selected.length < cfg.minSelections) {
    return `Please select at least ${cfg.minSelections}`;
  }
  if (cfg.maxSelections !== undefined && selected.length > cfg.maxSelections) {
    return `Please select at most ${cfg.maxSelections}`;
  }

  if (selected.includes('Other') && question.hasOther && (!otherText || otherText.trim() === '')) {
    return "Please specify your 'Other' answer";
  }

  return null;
}

// ── Dropdown ────────────────────────────────────────────────────────────

function validateDropdown(value: string, question: QuestionSpec): string | null {
  const validValues = new Set((question.options ?? []).map((o) => o.value));
  if (!validValues.has(value)) {
    return 'Please select a valid option';
  }
  return null;
}
