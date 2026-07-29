/**
 * Shared answer validation — the same rules run on the client (QuestionCard)
 * and the server (ws-handler, respondent.service). Returns null when valid,
 * otherwise a human-readable error string.
 */

const LIKERT_VALUES = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

/**
 * Hard cap independent of a question's configured maxLength: without it a
 * text/textarea question with no maxLength lets a caller persist an unbounded
 * value into DO SQLite — a storage-exhaustion vector.
 */
export const MAX_ANSWER_LENGTH = 20_000;

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
  // The declared type doesn't stop a hand-crafted request sending a JSON
  // number, which would throw on .trim() and surface as a server 500.
  if (typeof value !== 'string') value = value == null ? '' : String(value);

  // Absolute length ceiling, enforced before any per-type logic so it applies
  // even to types/configs that would otherwise accept unbounded input.
  if (value.length > MAX_ANSWER_LENGTH || (otherText !== undefined && otherText.length > MAX_ANSWER_LENGTH)) {
    return `Answer must be at most ${MAX_ANSWER_LENGTH} characters`;
  }

  const trimmed = value.trim();
  const cfg = question.config ?? {};

  if (question.required && trimmed === '') {
    return 'This question is required';
  }
  if (trimmed === '') return null;

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

function validateRating(value: string, cfg: NonNullable<QuestionSpec['config']>): string | null {
  const n = Number(value);
  const scaleMax = cfg.scaleMax ?? 5;
  if (!Number.isInteger(n) || n < 1 || n > scaleMax) {
    return 'Please select a rating';
  }
  return null;
}

function validateNps(value: string): string | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 10) {
    return 'Please select a score from 0 to 10';
  }
  return null;
}

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

  // A value of "," survives the top-level required check (trim keeps commas)
  // while representing zero real selections — re-check the parsed count.
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

function validateDropdown(value: string, question: QuestionSpec): string | null {
  const validValues = new Set((question.options ?? []).map((o) => o.value));
  if (!validValues.has(value)) {
    return 'Please select a valid option';
  }
  return null;
}
