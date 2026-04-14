import { describe, it, expect } from 'vitest';
import { validateAnswer, type QuestionSpec } from '../../backend/src/answer-validation';

function q(overrides: Partial<QuestionSpec> & { type: string }): QuestionSpec {
  return { required: true, ...overrides };
}

// ═══════════════════════════════════════════════════════════════════════════
// Required check (all types)
// ═══════════════════════════════════════════════════════════════════════════

describe('required check', () => {
  it('rejects empty value on required question', () => {
    expect(validateAnswer(q({ type: 'text', required: true }), '')).toBe('This question is required');
    expect(validateAnswer(q({ type: 'text', required: true }), '   ')).toBe('This question is required');
  });

  it('accepts empty value on optional question', () => {
    expect(validateAnswer(q({ type: 'text', required: false }), '')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Text
// ═══════════════════════════════════════════════════════════════════════════

describe('text validation', () => {
  it('accepts valid text', () => {
    expect(validateAnswer(q({ type: 'text' }), 'Hello')).toBeNull();
  });

  it('rejects text below minLength', () => {
    expect(validateAnswer(q({ type: 'text', config: { minLength: 5 } }), 'Hi')).toBe('Must be at least 5 characters');
  });

  it('accepts text at minLength', () => {
    expect(validateAnswer(q({ type: 'text', config: { minLength: 5 } }), 'Hello')).toBeNull();
  });

  it('rejects text above maxLength', () => {
    expect(validateAnswer(q({ type: 'text', maxLength: 3 }), 'Hello')).toBe('Must be at most 3 characters');
  });

  it('rejects text below minWords', () => {
    expect(validateAnswer(q({ type: 'textarea', config: { minWords: 3 } }), 'Just two')).toBe(
      'Must be at least 3 words',
    );
  });

  it('accepts text at minWords', () => {
    expect(validateAnswer(q({ type: 'textarea', config: { minWords: 3 } }), 'Three words here')).toBeNull();
  });

  it('rejects text above maxWords', () => {
    expect(validateAnswer(q({ type: 'textarea', config: { maxWords: 2 } }), 'One two three')).toBe(
      'Must be at most 2 words',
    );
  });

  it('validates against custom pattern', () => {
    expect(validateAnswer(q({ type: 'text', config: { pattern: '^\\d{3}-\\d{4}$' } }), '123-4567')).toBeNull();
    expect(validateAnswer(q({ type: 'text', config: { pattern: '^\\d{3}-\\d{4}$' } }), 'abc')).toBe(
      'Answer does not match the required format',
    );
  });

  it('uses custom pattern error message', () => {
    const spec = q({
      type: 'text',
      config: { pattern: '^#', patternError: 'Must start with #' },
    });
    expect(validateAnswer(spec, 'hello')).toBe('Must start with #');
    expect(validateAnswer(spec, '#hello')).toBeNull();
  });

  it('skips invalid regex gracefully', () => {
    expect(validateAnswer(q({ type: 'text', config: { pattern: '[invalid' } }), 'anything')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Email
// ═══════════════════════════════════════════════════════════════════════════

describe('email validation', () => {
  it('accepts valid email', () => {
    expect(validateAnswer(q({ type: 'email' }), 'user@example.com')).toBeNull();
  });

  it('rejects missing @', () => {
    expect(validateAnswer(q({ type: 'email' }), 'userexample.com')).toBe('Please enter a valid email address');
  });

  it('rejects missing domain', () => {
    expect(validateAnswer(q({ type: 'email' }), 'user@')).toBe('Please enter a valid email address');
  });

  it('rejects spaces', () => {
    expect(validateAnswer(q({ type: 'email' }), 'user @example.com')).toBe('Please enter a valid email address');
  });

  it('enforces allowed domains', () => {
    const spec = q({ type: 'email', config: { allowedDomains: ['company.com', 'corp.net'] } });
    expect(validateAnswer(spec, 'alice@company.com')).toBeNull();
    expect(validateAnswer(spec, 'bob@corp.net')).toBeNull();
    expect(validateAnswer(spec, 'eve@gmail.com')).toBe('Email must be from: company.com, corp.net');
  });

  it('allowed domains check is case-insensitive', () => {
    const spec = q({ type: 'email', config: { allowedDomains: ['Company.COM'] } });
    expect(validateAnswer(spec, 'alice@company.com')).toBeNull();
  });

  it('skips domain check when allowedDomains is empty', () => {
    expect(validateAnswer(q({ type: 'email', config: { allowedDomains: [] } }), 'a@b.com')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Number
// ═══════════════════════════════════════════════════════════════════════════

describe('number validation', () => {
  it('accepts valid number', () => {
    expect(validateAnswer(q({ type: 'number' }), '42')).toBeNull();
    expect(validateAnswer(q({ type: 'number' }), '-3.14')).toBeNull();
  });

  it('rejects non-numeric', () => {
    expect(validateAnswer(q({ type: 'number' }), 'abc')).toBe('Please enter a valid number');
  });

  it('rejects NaN', () => {
    expect(validateAnswer(q({ type: 'number' }), 'NaN')).toBe('Please enter a valid number');
  });

  it('enforces min', () => {
    expect(validateAnswer(q({ type: 'number', config: { min: 0 } }), '-1')).toBe('Must be at least 0');
  });

  it('enforces max', () => {
    expect(validateAnswer(q({ type: 'number', config: { max: 100 } }), '101')).toBe('Must be at most 100');
  });

  it('enforces integerOnly', () => {
    expect(validateAnswer(q({ type: 'number', config: { integerOnly: true } }), '3.5')).toBe(
      'Please enter a whole number',
    );
    expect(validateAnswer(q({ type: 'number', config: { integerOnly: true } }), '3')).toBeNull();
  });

  it('enforces step', () => {
    const spec = q({ type: 'number', config: { step: 5, min: 0 } });
    expect(validateAnswer(spec, '10')).toBeNull();
    expect(validateAnswer(spec, '15')).toBeNull();
    expect(validateAnswer(spec, '7')).toBe('Must be a multiple of 5');
  });

  it('step works with non-zero min', () => {
    const spec = q({ type: 'number', config: { step: 3, min: 1 } });
    expect(validateAnswer(spec, '1')).toBeNull(); // 1 + 0*3
    expect(validateAnswer(spec, '4')).toBeNull(); // 1 + 1*3
    expect(validateAnswer(spec, '3')).toBe('Must be a multiple of 3');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Rating
// ═══════════════════════════════════════════════════════════════════════════

describe('rating validation', () => {
  it('accepts valid rating', () => {
    expect(validateAnswer(q({ type: 'rating' }), '3')).toBeNull();
    expect(validateAnswer(q({ type: 'rating', config: { scaleMax: 10 } }), '10')).toBeNull();
  });

  it('rejects 0', () => {
    expect(validateAnswer(q({ type: 'rating' }), '0')).toBe('Please select a rating');
  });

  it('rejects above scaleMax', () => {
    expect(validateAnswer(q({ type: 'rating' }), '6')).toBe('Please select a rating');
    expect(validateAnswer(q({ type: 'rating', config: { scaleMax: 10 } }), '11')).toBe('Please select a rating');
  });

  it('rejects non-integer', () => {
    expect(validateAnswer(q({ type: 'rating' }), '3.5')).toBe('Please select a rating');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// NPS
// ═══════════════════════════════════════════════════════════════════════════

describe('nps validation', () => {
  it('accepts 0-10', () => {
    for (let i = 0; i <= 10; i++) {
      expect(validateAnswer(q({ type: 'nps' }), String(i))).toBeNull();
    }
  });

  it('rejects 11', () => {
    expect(validateAnswer(q({ type: 'nps' }), '11')).toBe('Please select a score from 0 to 10');
  });

  it('rejects -1', () => {
    expect(validateAnswer(q({ type: 'nps' }), '-1')).toBe('Please select a score from 0 to 10');
  });

  it('rejects decimal', () => {
    expect(validateAnswer(q({ type: 'nps' }), '5.5')).toBe('Please select a score from 0 to 10');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Likert
// ═══════════════════════════════════════════════════════════════════════════

describe('likert validation', () => {
  it('accepts all 5 valid labels', () => {
    for (const label of ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']) {
      expect(validateAnswer(q({ type: 'likert' }), label)).toBeNull();
    }
  });

  it('rejects arbitrary string', () => {
    expect(validateAnswer(q({ type: 'likert' }), 'Maybe')).toBe('Please select a valid option');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Radio
// ═══════════════════════════════════════════════════════════════════════════

describe('radio validation', () => {
  const opts = [{ value: 'A' }, { value: 'B' }, { value: 'C' }];

  it('accepts valid option', () => {
    expect(validateAnswer(q({ type: 'radio', options: opts }), 'B')).toBeNull();
  });

  it('rejects value not in options', () => {
    expect(validateAnswer(q({ type: 'radio', options: opts }), 'Z')).toBe('Please select a valid option');
  });

  it('accepts Other when hasOther', () => {
    expect(validateAnswer(q({ type: 'radio', options: opts, hasOther: true }), 'Other', 'My answer')).toBeNull();
  });

  it('rejects Other without otherText', () => {
    expect(validateAnswer(q({ type: 'radio', options: opts, hasOther: true }), 'Other', '')).toBe(
      'Please specify your answer',
    );
    expect(validateAnswer(q({ type: 'radio', options: opts, hasOther: true }), 'Other')).toBe(
      'Please specify your answer',
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Checkbox
// ═══════════════════════════════════════════════════════════════════════════

describe('checkbox validation', () => {
  const opts = [{ value: 'X' }, { value: 'Y' }, { value: 'Z' }];

  it('accepts valid single selection', () => {
    expect(validateAnswer(q({ type: 'checkbox', options: opts }), 'X')).toBeNull();
  });

  it('accepts valid multi selection', () => {
    expect(validateAnswer(q({ type: 'checkbox', options: opts }), 'X,Z')).toBeNull();
  });

  it('rejects invalid option', () => {
    expect(validateAnswer(q({ type: 'checkbox', options: opts }), 'X,INVALID')).toBe('Invalid selection: INVALID');
  });

  it('enforces minSelections', () => {
    expect(validateAnswer(q({ type: 'checkbox', options: opts, config: { minSelections: 2 } }), 'X')).toBe(
      'Please select at least 2',
    );
  });

  it('enforces maxSelections', () => {
    expect(validateAnswer(q({ type: 'checkbox', options: opts, config: { maxSelections: 1 } }), 'X,Y')).toBe(
      'Please select at most 1',
    );
  });

  it('accepts Other with text when hasOther', () => {
    expect(validateAnswer(q({ type: 'checkbox', options: opts, hasOther: true }), 'X,__other__', 'Custom')).toBeNull();
  });

  it('rejects Other without text when hasOther', () => {
    expect(validateAnswer(q({ type: 'checkbox', options: opts, hasOther: true }), 'X,__other__', '')).toBe(
      "Please specify your 'Other' answer",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Dropdown
// ═══════════════════════════════════════════════════════════════════════════

describe('dropdown validation', () => {
  const opts = [{ value: 'opt1' }, { value: 'opt2' }];

  it('accepts valid option', () => {
    expect(validateAnswer(q({ type: 'dropdown', options: opts }), 'opt1')).toBeNull();
  });

  it('rejects value not in options', () => {
    expect(validateAnswer(q({ type: 'dropdown', options: opts }), 'opt3')).toBe('Please select a valid option');
  });
});
